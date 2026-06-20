import { Router } from "express";
import { z } from "zod";
import { callGemini } from "../lib/gemini";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import {
  addMessage, createConversation, findConversationById,
  listConversationMessages, listUserConversations, getUserAnalytics,
} from "../lib/mongo";
import { FALLBACK_RESPONSES } from "../lib/crisis";
import { empathyAgent } from "../agents/empathy";
import { studyAgent } from "../agents/study";
import { mentalAgent } from "../agents/mental";
import { realityAgent } from "../agents/reality";

const router = Router();

const LANGUAGE_NAMES: Record<string, string> = {
  "en-IN": "English",
  "hi-IN": "Hindi",
  "kn-IN": "Kannada",
  "te-IN": "Telugu",
  "ta-IN": "Tamil",
};

const ChatBody = z.object({
  message: z.string(),
  language: z.string().optional(),
  conversationId: z.string().optional(),
});

function buildPrompt(message: string, langLabel: string, language: string): string {
  const langRule = language && language !== "en-IN"
    ? `The "${realityAgent.field}" field MUST be written entirely in ${langLabel} script. Not a single English word in finalResponse. The other 3 fields stay in English.`
    : `The "${realityAgent.field}" field must be in casual conversational Indian English.`;

  return `You are Saathi — an AI companion for Indian students aged 14-22. Run 4 internal analyses on the student's message and return ONE JSON object with all results.
${langRule}
Return ONLY valid JSON in this exact shape (no markdown, no code fences):
{
  "${empathyAgent.field}": "${empathyAgent.prompt}",
  "${studyAgent.field}": "${studyAgent.prompt}",
  "${mentalAgent.field}": "${mentalAgent.prompt}",
  "${realityAgent.field}": "${realityAgent.prompt}"
}
Student message: ${message}`;
}

router.post("/chat", requireAuth, async (req: AuthRequest, res) => {
  let language: string | undefined;

  try {
    const parsed = ChatBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }

    const { message, language: lang, conversationId } = parsed.data;
    language = lang;
    const userId = req.user!.id;

    let conversation = null;
    if (conversationId) {
      conversation = await findConversationById(conversationId, userId);
      if (!conversation) {
        res.status(404).json({ error: "Conversation not found" });
        return;
      }
    }
    if (!conversation) {
      conversation = await createConversation(userId, message.trim().slice(0, 80) || "New conversation");
    }

    const conversationIdToUse = conversation!._id.toHexString();
    await addMessage(conversationIdToUse, userId, "user", message);

    const langLabel = language ? (LANGUAGE_NAMES[language] ?? "English") : "English";
    const result = await callGemini({
      contents: [{ role: "user", parts: [{ text: buildPrompt(message, langLabel, language ?? "en-IN") }] }],
      config: { maxOutputTokens: 1500, responseMimeType: "application/json" },
    });

    const raw = String(result.text ?? "").trim();
    let data: any = {};
    let assistantText: string;

    try {
      data = JSON.parse(raw);
      assistantText = String((data.finalResponse ?? data.response ?? raw) || "").trim();
    } catch {
      assistantText = raw || "I'm here for you. Tell me what's going on.";
    }

    if (!assistantText) assistantText = "I'm here for you. Tell me what's going on.";

    await addMessage(conversationIdToUse, userId, "assistant", assistantText);

    res.json({
      conversationId: conversationIdToUse,
      response: assistantText,
      pipeline: [
        { agent: empathyAgent.name, insight: data.empathy ?? "—" },
        { agent: studyAgent.name, insight: data.study ?? "—" },
        { agent: mentalAgent.name, insight: data.mentalHealth ?? "—" },
        { agent: realityAgent.name, insight: "Final response crafted from all insights above." },
      ],
    });
  } catch (err: any) {
    req.log.error({ err }, "Saathi chat error");

    if (err?.name === "AllModelsExhaustedError") {
      const langKey = language && language !== "en-IN" ? language : "en-IN";
      const responses = FALLBACK_RESPONSES[langKey] ?? FALLBACK_RESPONSES["en-IN"];
      const randomFallback = responses[Math.floor(Math.random() * responses.length)];
      res.json({
        response: randomFallback,
        pipeline: [
          { agent: empathyAgent.name, insight: "Student needs immediate support regardless of AI availability." },
          { agent: studyAgent.name, insight: "No specific academic concern - focus on emotional support." },
          { agent: mentalAgent.name, insight: "User needs reassurance and presence during AI downtime." },
          { agent: realityAgent.name, insight: "Providing human-like fallback response during AI exhaustion." },
        ],
      });
      return;
    }

    res.status(500).json({ error: err?.message ?? "Failed to get response from Saathi" });
  }
});

router.get("/conversations", requireAuth, async (req: AuthRequest, res) => {
  try {
    const conversations = await listUserConversations(req.user!.id);
    res.json(conversations.map((c) => ({
      id: c._id.toHexString(), title: c.title, createdAt: c.createdAt, updatedAt: c.updatedAt,
    })));
  } catch (err: any) {
    req.log.error({ err }, "Error listing conversations");
    res.status(500).json({ error: "Failed to list conversations" });
  }
});

router.get("/conversations/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const conversation = await findConversationById(String(req.params.id), req.user!.id);
    if (!conversation) { res.status(404).json({ error: "Conversation not found" }); return; }
    const messages = await listConversationMessages(String(req.params.id), req.user!.id);
    res.json({
      id: conversation._id.toHexString(),
      title: conversation.title,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      messages: messages.map((m) => ({
        id: m._id.toHexString(), role: m.role, content: m.content, createdAt: m.createdAt,
      })),
    });
  } catch (err: any) {
    req.log.error({ err }, "Error getting conversation");
    res.status(500).json({ error: "Failed to get conversation" });
  }
});

router.get("/dashboard", requireAuth, async (req: AuthRequest, res) => {
  try {
    res.json(await getUserAnalytics(req.user!.id));
  } catch (err: any) {
    req.log.error({ err }, "Error fetching dashboard");
    res.status(500).json({ error: "Failed to load dashboard data" });
  }
});

export default router;
