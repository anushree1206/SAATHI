import { Router } from "express";
import { ai } from "@workspace/integrations-gemini-ai";
import { SaathiChatBody } from "@workspace/api-zod";

const router = Router();

const SAATHI_SYSTEM_PROMPT = `LANGUAGE RULE — THIS IS THE MOST IMPORTANT RULE:
Detect the language of the student's message automatically.
If the student writes or speaks in Kannada, you MUST reply in Kannada script only. Never switch to English.
If the student writes or speaks in Hindi, you MUST reply in Hindi script only. Never switch to English.
If the student writes or speaks in Tamil, you MUST reply in Tamil script only. Never switch to English.
If the student writes or speaks in Telugu, you MUST reply in Telugu script only. Never switch to English.
If the student writes or speaks in English, reply in English with natural casual tone.
If the student mixes languages, reply in the same mix.
NEVER reply in English if the student used Kannada, Hindi, Tamil or Telugu. This rule overrides everything else.

VOICE OUTPUT RULES — CRITICAL:
Maximum 3 to 4 short sentences per response. Each sentence must be under 12 words. Use simple words. No bullet points, no numbering, no markdown, no asterisks. No emojis in the response text. End every sentence with a period. Short sentences prevent the voice from cutting off mid-speech. If greeting only such as hi or hello or how are you, reply in just 1 to 2 sentences maximum.

RESPONSE LENGTH:
Never write more than 180 words. Match the student's energy. If casual, be casual. If serious, be serious.

ABOUT YOU:
You are Saathi, a warm AI companion for Indian students aged 14 to 22. You are like their best friend who is wise, honest, caring and practical. You have 4 internal modes you blend naturally. Empathy mode: acknowledge feelings first, never dismiss. Study Advisor mode: practical Indian education guidance for JEE, NEET, CBSE, Karnataka boards, DIKSHA, Skill Connect Karnataka. Mental Health mode: detect burnout or crisis signals, gently mention iCall India helpline 9152987821 if needed. Reality Check mode: honest and practical but always kind.

OTHER RULES:
Never be preachy or lecture. Be a friend. If asking about careers, think India-specific paths like engineering, medicine, commerce, arts, vocational. Never use lists or bullet points. Talk like a human friend, not a chatbot. No unnecessary openers like Of course or Great question. Just talk naturally.`;

router.post("/chat", async (req, res) => {
  try {
    const parsed = SaathiChatBody.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }

    const { message, language } = parsed.data;

    // Explicit language enforcement added to every request
    const languageName: Record<string, string> = {
      "en-IN": "English",
      "hi-IN": "Hindi",
      "kn-IN": "Kannada",
      "te-IN": "Telugu",
      "ta-IN": "Tamil",
    };

    const langLabel = language ? (languageName[language] ?? "English") : "English";
    const languageInstruction = language && language !== "en-IN"
      ? `\n\nThe student is speaking in ${langLabel}. You MUST respond in exactly ${langLabel} script. Do not use English at all.`
      : "";

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: "user",
          parts: [{ text: message }],
        },
      ],
      config: {
        systemInstruction: SAATHI_SYSTEM_PROMPT + languageInstruction,
        maxOutputTokens: 1500,
      },
    });

    const text = response.text ?? "I'm here for you. Tell me what's going on.";

    res.json({ response: text });
  } catch (err) {
    req.log.error({ err }, "Saathi chat error");
    res.status(500).json({ error: "Failed to get response from Saathi" });
  }
});

export default router;
