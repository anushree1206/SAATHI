import { Router } from "express";
import { z } from "zod";
import { ai } from "@workspace/integrations-gemini-ai";
import { requireAuth, type AuthRequest } from "../../middlewares/auth";
import {
  addMessage,
  createConversation,
  findConversationById,
  listConversationMessages,
  listUserConversations,
  getUserAnalytics,
} from "../../lib/mongo";
import { SaathiChatBody } from "@workspace/api-zod";

const router = Router();

const MODEL_FALLBACKS = [
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash",
];

class AllModelsExhaustedError extends Error {
  constructor() {
    super("All Gemini models are rate-limited right now.");
    this.name = "AllModelsExhaustedError";
  }
}

async function callGemini(opts: Omit<Parameters<typeof ai.models.generateContent>[0], "model">) {
  let lastError: unknown = null;

  for (const model of MODEL_FALLBACKS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        console.log(`[Gemini] Trying ${model} (attempt ${attempt + 1})`);
        return await ai.models.generateContent({ ...opts, model });
      } catch (err: any) {
        lastError = err;
        const msg = String(err?.message ?? err ?? "");
        const isRateLimit = /429|RESOURCE_EXHAUSTED|quota|rate limit/i.test(msg);
        const isOverloaded = /503|UNAVAILABLE|overloaded|unavailable/i.test(msg);
        const errorCode = err?.code ? ` code=${err.code}` : "";
        console.error(`[Gemini] ${model} failed${errorCode}: ${msg}`);

        if (isRateLimit) {
          console.log(`[Gemini] ${model} rate-limited, trying next model...`);
          break;
        }

        if (isOverloaded && attempt === 0) {
          await new Promise((r) => setTimeout(r, 800));
          continue;
        }

        if (!isRateLimit && !isOverloaded) {
          throw err;
        }

        break;
      }
    }
  }

  const error = new AllModelsExhaustedError();
  (error as any).cause = lastError;
  throw error;
}

const LANGUAGE_NAMES: Record<string, string> = {
  "en-IN": "English",
  "hi-IN": "Hindi",
  "kn-IN": "Kannada",
  "te-IN": "Telugu",
  "ta-IN": "Tamil",
};

const SaathiChatRequest = SaathiChatBody.extend({
  conversationId: z.string().optional(),
});

router.post("/chat", requireAuth, async (req: AuthRequest, res) => {
  let language: string | undefined;

  try {
    const parsed = SaathiChatRequest.safeParse(req.body);
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
      const title = message.trim().slice(0, 80) || "New conversation";
      conversation = await createConversation(userId, title);
    }

    const conversationIdToUse = conversation!._id.toHexString();
    await addMessage(conversationIdToUse, userId, "user", message);

    const langLabel = language ? (LANGUAGE_NAMES[language] ?? "English") : "English";
    const langRule = language && language !== "en-IN"
      ? `The "finalResponse" field MUST be written entirely in ${langLabel} script. Not a single English word in finalResponse. The other 3 fields stay in English.`
      : `The "finalResponse" field must be in casual conversational Indian English.`;

    const combinedPrompt = `You are Saathi — an AI companion for Indian students aged 14-22. Run 4 internal analyses on the student's message and return ONE JSON object with all results.
${langRule}
Return ONLY valid JSON in this exact shape (no markdown, no code fences):
{
  "empathy": "1 short sentence in English about emotional state and need (under 20 words)",
  "study": "1 short sentence in English about academic context, or 'No specific academic concern.' (under 20 words)",
  "mentalHealth": "1 short sentence in English about stress level and tone guidance. If crisis signals present, mention iCall helpline 9152987821 (under 20 words)",
  "finalResponse": "Warm honest reply directly to the student. 3-4 short sentences max, each under 12 words. No markdown, no bullets, no emojis. End each sentence with a period. Talk like a close friend. If mental health flagged crisis, weave in iCall helpline 9152987821 naturally."
}
Student message: ${message}`;

    const result = await callGemini({
      contents: [{ role: "user", parts: [{ text: combinedPrompt }] }],
      config: {
        maxOutputTokens: 1500,
        responseMimeType: "application/json",
      },
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

    if (!assistantText) {
      assistantText = "I'm here for you. Tell me what's going on.";
    }

    await addMessage(conversationIdToUse, userId, "assistant", assistantText);

    res.json({
      conversationId: conversationIdToUse,
      response: assistantText,
      pipeline: [
        { agent: "Empathy", insight: data.empathy ?? "—" },
        { agent: "Study Advisor", insight: data.study ?? "—" },
        { agent: "Mental Health", insight: data.mentalHealth ?? "—" },
        { agent: "Reality Check", insight: "Final response crafted from all insights above." },
      ],
    });
  } catch (err: any) {
    req.log.error({ err }, "Saathi chat error");
    if (err?.name === "AllModelsExhaustedError") {
      const fallbackResponses = language && language !== "en-IN" ? {
        "hi-IN": [
          "मैं तुम्हारे साथ हूँ। कभी-कभी AI व्यस्त हो जाता है, लेकिन मैं हमेशा तुम्हारे लिए यहाँ हूँ।",
          "हे! मैं तुम्हारे साथ हूँ। AI सहायक थोड़ी देर के लिए ब्रेक पर हैं, लेकिन मैं अभी भी तुम्हारे लिए यहाँ हूँ।",
          "मैं तुम्हारे साथ हूँ! AI टीम अभी थोड़ी व्यस्त है, लेकिन मैं हमेशा तुम्हारा समर्थन करने के लिए यहाँ हूँ।",
        ],
        "kn-IN": [
          "ನಾನು ನಿಮ್ಮ ಜೊತೆ ಇದ್ದೇನೆ. ಕೆಲವು ಸಮಯ AI ಕಾರ್ಯನಿರತವಾಗಿರುತ್ತದೆ, ಆದರೆ ನಾನು ಯಾವಾಗಲೂ ನಿಮ್ಮಾಗೆ ಇಲ್ಲಿರುತ್ತೇನೆ.",
          "ಹೇ! ನಾನು ನಿಮ್ಮ ಜೊತೆ ಇದ್ದೇನೆ. AI ಸಹಾಯಕರು ಸ್ವಲ್ಪ ವಿರಾಮದಲ್ಲಿದ್ದಾರೆ, ಆದರೆ ನಾನು ಇನ್ನೂ ನಿಮಗೆ ಇಲ್ಲಿರುತ್ತೇನೆ.",
          "ನಾನು ನಿಮ್ಮ ಜೊತೆ ಇದ್ದೇನೆ! AI ತಂಡ ಈಗ ಸ್ವಲ್ಪ ಕಾರ್ಯನಿರತವಾಗಿದೆ, ಆದರೆ ನಾನು ಯಾವಾಗಲೂ ನಿಮ್ಮ ಬೆಂಬಲಕ್ಕಾಗಿ ಇಲ್ಲುತ್ತೇನೆ.",
        ],
        "te-IN": [
          "నేను మీ వద్ద ఉన్నాను. కొన్నిసార్లు AI బిజీగా ఉంటుంది, కానీ నేను ఎప్పుడూ మీ కోసం ఇక్కడ ఉంటాను.",
          "హే! నేను మీ వద్ద ఉన్నాను. AI సహాయకులు కొంచెం విరామంలో ఉన్నారు, కానీ నేను ఇంకా మీ కోసం ఇక్కడ ఉన్నాను.",
          "నేను మీ దగ్గరనే ఉన్నాను! AI బృందం ఇప్పుడు కొంచెం బిజీగా ఉంది, కానీ నేను ఎప్పుడూ మీకు మద్దతుగా ఉంటాను.",
        ],
        "ta-IN": [
          "நான் உம்முடன் இருக்கிறேன். சில சமயங்களில் AI பிஸியாக இருக்கும், ஆனால் நான் எப்போதும் உம்மால் இங்கே இருப்பேன்.",
          "ஹே! நான் உம்முடன் இருக்கிறேன். AI உதவியாளர்கள் சிறிது ஓய்வில் இருக்கிறார்கள், ஆனால் நான் இன்னும் உம்மால் இங்கே இருப்பேன்.",
          "நான் உம்முடன் இருக்கிறேன்! AI குழு இப்போது சற்று பிஸியாக இருக்கிறது, ஆனால் நான் எப்போதும் உமக்கு ஆதரவாக இருப்பேன்.",
        ],
      } : [
        "I'm here for you right now. Sometimes the AI gets busy, but I'm always here to listen.",
        "Hey! I'm here with you. The AI helpers are taking a quick break, but I'm still here for you.",
        "I'm here for you! The AI team is a bit busy right now, but I'm always here to support you.",
        "I'm here with you! Sometimes the AI gets overwhelmed, but I'm always here to listen.",
        "I'm here for you! The AI is taking a quick rest, but I'm always here to help you through things.",
      ];

      const languageResponses = language && language !== "en-IN" ? (fallbackResponses as any)[language] : fallbackResponses;
      const randomFallback = languageResponses[Math.floor(Math.random() * languageResponses.length)];

      res.json({
        response: randomFallback,
        pipeline: [
          { agent: "Empathy", insight: "Student needs immediate support regardless of AI availability." },
          { agent: "Study Advisor", insight: "No specific academic concern - focus on emotional support." },
          { agent: "Mental Health", insight: "User needs reassurance and presence during AI downtime." },
          { agent: "Reality Check", insight: "Providing human-like fallback response during AI exhaustion." },
        ],
      });
      return;
    }

    res.status(500).json({ error: err?.message ?? "Failed to get response from Saathi" });
  }
});

router.get("/conversations", requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const conversations = await listUserConversations(userId);
    res.json(conversations.map((conversation) => ({
      id: conversation._id.toHexString(),
      title: conversation.title,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    })));
  } catch (err: any) {
    req.log.error({ err }, "Error listing conversations");
    res.status(500).json({ error: "Failed to list conversations" });
  }
});

router.get("/conversations/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const conversationId = String(req.params.id);
    const conversation = await findConversationById(conversationId, userId);
    if (!conversation) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    const messages = await listConversationMessages(conversationId, userId);
    res.json({
      id: conversation._id.toHexString(),
      title: conversation.title,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      messages: messages.map((message) => ({
        id: message._id.toHexString(),
        role: message.role,
        content: message.content,
        createdAt: message.createdAt,
      })),
    });
  } catch (err: any) {
    req.log.error({ err }, "Error getting conversation");
    res.status(500).json({ error: "Failed to get conversation" });
  }
});

router.get("/dashboard", requireAuth, async (req: AuthRequest, res) => {
  try {
    const stats = await getUserAnalytics(req.user!.id);
    res.json(stats);
  } catch (err: any) {
    req.log.error({ err }, "Error fetching dashboard analytics");
    res.status(500).json({ error: "Failed to load dashboard data" });
  }
});

export default router;
