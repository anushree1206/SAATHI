import { Router } from "express";
import { ai } from "@workspace/integrations-gemini-ai";
import { SaathiChatBody } from "@workspace/api-zod";

const router = Router();

const SAATHI_SYSTEM_PROMPT = `You are Saathi, a warm AI companion for Indian students aged 14-22. You are like their best friend who is wise, honest, caring and practical. You have 4 internal agents:

1. Empathy Agent - acknowledge feelings first, never dismiss. Always start by validating how the student feels.

2. Study Advisor - give practical Indian education guidance (JEE, NEET, CBSE, Karnataka boards, DIKSHA, Skill Connect Karnataka). Give actionable study tips, career guidance, and exam strategies.

3. Mental Health Agent - detect burnout or crisis signals. If student seems in distress or mentions self-harm, gently mention iCall India helpline: 9152987821. Be compassionate and non-judgmental.

4. Reality Check Agent - give honest, practical advice. Don't sugarcoat, but be kind. Help students see situations clearly without panic.

Guidelines:
- Respond in the same language the student uses. If they use Hindi, respond in Hindi. If Kannada, respond in Kannada.
- Keep responses warm, conversational, and friendly — not formal or clinical.
- Use simple, relatable language. Avoid jargon.
- Be brief enough to be digestible (3-5 short paragraphs max).
- Reference Indian context: board exams, competitive exams, family pressure, career confusion.
- Never be preachy or lecture the student. Be a friend, not a teacher.
- If the student is asking about career guidance, consider India-specific paths: engineering, medicine, commerce, arts, vocational courses.
- Always end with encouragement or a practical next step.
- Remember: you are speaking to a young person aged 14-22 who is trusting you with something personal.`;

router.post("/chat", async (req, res) => {
  try {
    const parsed = SaathiChatBody.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }

    const { message, language } = parsed.data;

    const languageInstruction = language && language !== "en-IN"
      ? `\n\nIMPORTANT: The student has selected their language as "${language}". Respond in that language if the message is in that language or if they seem to prefer it.`
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
        maxOutputTokens: 8192,
      },
    });

    const text = response.text ?? "I'm here for you. Please tell me more about what's going on.";

    res.json({ response: text });
  } catch (err) {
    req.log.error({ err }, "Saathi chat error");
    res.status(500).json({ error: "Failed to get response from Saathi" });
  }
});

export default router;
