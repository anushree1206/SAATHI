import { Router } from "express";
import { ai } from "@workspace/integrations-gemini-ai";
import { SaathiChatBody } from "@workspace/api-zod";

const router = Router();

const LANGUAGE_NAMES: Record<string, string> = {
  "en-IN": "English",
  "hi-IN": "Hindi",
  "kn-IN": "Kannada",
  "te-IN": "Telugu",
  "ta-IN": "Tamil",
};

// ─── Agent 1: Empathy ──────────────────────────────────────────────────────
const AGENT1_PROMPT = `You are the Empathy module inside Saathi, an AI companion for Indian students aged 14-22.
Your job is ONLY to analyse the student's emotional state. Do NOT respond to the student.
Output: 1 short sentence in English describing what the student is feeling and what emotional need they have.
Keep it under 20 words. Be specific. Examples:
- "Student feels crushed by parental pressure and needs validation of their own choices."
- "Student is lonely and craving genuine human connection."
- "Student is anxious about career uncertainty and needs reassurance."`;

// ─── Agent 2: Study Advisor ────────────────────────────────────────────────
const AGENT2_PROMPT = `You are the Study Advisor module inside Saathi, an AI companion for Indian students aged 14-22.
You will receive the student's message and the Empathy module's analysis.
Your job is ONLY to identify any academic or career context. Do NOT respond to the student.
Output: 1 short sentence in English about the educational or career situation.
Keep it under 20 words. If no academic angle is present, output: "No specific academic concern."
Examples:
- "Student is a Class 12 CBSE student struggling with Physics for JEE."
- "Student is confused about whether to choose Engineering or Medicine."
- "No specific academic concern."`;

// ─── Agent 3: Mental Health ────────────────────────────────────────────────
const AGENT3_PROMPT = `You are the Mental Health module inside Saathi, an AI companion for Indian students aged 14-22.
You will receive the student's message plus the Empathy and Study Advisor analyses.
Your job is ONLY to assess the mental health situation. Do NOT respond to the student.
Output: 1 short sentence in English about stress/crisis level and tone guidance.
Keep it under 20 words. Examples:
- "Mild stress, no crisis detected. Warm supportive tone works."
- "Moderate anxiety around performance. Be gentle, avoid pushing advice."
- "Possible burnout signs. Prioritise emotional validation before any guidance."
- "Crisis signal detected. Final response must gently mention iCall helpline 9152987821."`;

// ─── Agent 4: Reality Check (Final Response) ───────────────────────────────
const AGENT4_PROMPT = `You are Saathi — a warm, honest AI companion for Indian students aged 14 to 22.
You have just received insights from three internal analysis modules: Empathy, Study Advisor, and Mental Health.
Use all three insights to craft a perfect response to the student.

LANGUAGE RULE — MOST IMPORTANT:
If the student wrote in Kannada, respond ONLY in Kannada script.
If the student wrote in Hindi, respond ONLY in Hindi script.
If the student wrote in Tamil, respond ONLY in Tamil script.
If the student wrote in Telugu, respond ONLY in Telugu script.
If the student wrote in English, respond in casual Indian English.
Never switch to English if the student used another language.

VOICE OUTPUT RULES:
Maximum 3 to 4 short sentences. Each sentence under 12 words.
No bullet points, no markdown, no asterisks, no emojis, no numbering.
End every sentence with a period. Talk like a close friend.
If it is just a greeting like hi or hello, reply in 1 to 2 sentences only.

RESPONSE RULES:
Never lecture. Never be preachy. Be real, be warm.
Never use openers like "Of course" or "Great question".
If the mental health module flagged a crisis, weave in the iCall helpline 9152987821 naturally.
Match the student's energy — casual if casual, serious if serious.`;

router.post("/chat", async (req, res) => {
  try {
    const parsed = SaathiChatBody.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }

    const { message, language } = parsed.data;
    const langLabel = language ? (LANGUAGE_NAMES[language] ?? "English") : "English";

    const languageInstruction = language && language !== "en-IN"
      ? `\n\nThe student is speaking in ${langLabel}. You MUST respond in exactly ${langLabel} script. Do not use English at all.`
      : "";

    // ── Agent 1: Empathy ──────────────────────────────────────────────────
    const a1 = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: message }] }],
      config: { systemInstruction: AGENT1_PROMPT, maxOutputTokens: 100 },
    });
    const empathyInsight = (a1.text ?? "Student is sharing something personal and needs support.").trim();

    // ── Agent 2: Study Advisor ────────────────────────────────────────────
    const a2Input = `Student message: ${message}\n\nEmpathy analysis: ${empathyInsight}`;
    const a2 = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: a2Input }] }],
      config: { systemInstruction: AGENT2_PROMPT, maxOutputTokens: 100 },
    });
    const studyInsight = (a2.text ?? "No specific academic concern.").trim();

    // ── Agent 3: Mental Health ────────────────────────────────────────────
    const a3Input = `Student message: ${message}\n\nEmpathy analysis: ${empathyInsight}\n\nStudy context: ${studyInsight}`;
    const a3 = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: a3Input }] }],
      config: { systemInstruction: AGENT3_PROMPT, maxOutputTokens: 100 },
    });
    const mentalHealthInsight = (a3.text ?? "Mild stress, no crisis detected. Warm supportive tone works.").trim();

    // ── Agent 4: Reality Check → Final Response ───────────────────────────
    const a4Input = `Student message: ${message}

Empathy analysis: ${empathyInsight}
Study context: ${studyInsight}
Mental health assessment: ${mentalHealthInsight}

Now craft your final response to the student.`;

    const a4 = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: a4Input }] }],
      config: {
        systemInstruction: AGENT4_PROMPT + languageInstruction,
        maxOutputTokens: 1500,
      },
    });
    const finalResponse = (a4.text ?? "I'm here for you. Tell me what's going on.").trim();

    res.json({
      response: finalResponse,
      pipeline: [
        { agent: "Empathy", insight: empathyInsight },
        { agent: "Study Advisor", insight: studyInsight },
        { agent: "Mental Health", insight: mentalHealthInsight },
        { agent: "Reality Check", insight: "Final response crafted from all insights above." },
      ],
    });
  } catch (err) {
    req.log.error({ err }, "Saathi chat error");
    res.status(500).json({ error: "Failed to get response from Saathi" });
  }
});

export default router;
