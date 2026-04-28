import { Router } from "express";
import { ai } from "@workspace/integrations-gemini-ai";
import { SaathiChatBody } from "@workspace/api-zod";

const router = Router();

// Fallback chain — each model has its own free-tier quota.
// If one is rate-limited, automatically try the next.
const MODEL_FALLBACKS = [
  "gemini-2.5-flash-lite",  // 20 RPM free tier
  "gemini-2.0-flash",       // 15 RPM free tier — separate quota pool
  "gemini-2.0-flash-lite",  // 30 RPM free tier — separate quota pool
  "gemini-1.5-flash",       // 15 RPM free tier — separate quota pool
];
// Custom error so the route can return a clean 429 to the frontend
class AllModelsExhaustedError extends Error {
  constructor() {
    super("All Gemini models are rate-limited right now.");
    this.name = "AllModelsExhaustedError";
  }
}
async function callGemini(opts: Omit<Parameters<typeof ai.models.generateContent>[0], "model">) {
  let lastErr: unknown;
  for (const model of MODEL_FALLBACKS) {
    // Try each model up to 2 times (1 quick retry per model)
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        console.log(`[Gemini] Trying ${model} (attempt ${attempt + 1})`);
        return await ai.models.generateContent({ ...opts, model });
      } catch (err: any) {
        lastErr = err;
        const msg = String(err?.message ?? err ?? "");
        const isRateLimit = msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("quota");
        const isOverloaded = msg.includes("503") || msg.includes("UNAVAILABLE") || msg.includes("overloaded");
        if (isRateLimit) {
          console.log(`[Gemini] ${model} rate-limited, trying next model...`);
          break; // skip to next model immediately
        }
        if (isOverloaded && attempt === 0) {
          await new Promise((r) => setTimeout(r, 800)); // quick retry once
          continue;
        }
        // any other error — give up on this model, try next
        break;
      }
    }
  }
  // Every model is exhausted
  throw new AllModelsExhaustedError();
}

const LANGUAGE_NAMES: Record<string, string> = {
  "en-IN": "English",
  "hi-IN": "Hindi",
  "kn-IN": "Kannada",
  "te-IN": "Telugu",
  "ta-IN": "Tamil",
};

router.post("/chat", async (req, res) => {
  try {
    const parsed = SaathiChatBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }
    const { message, language } = parsed.data;
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
    const raw = (result.text ?? "{}").trim();
    let data: any = {};
    try { data = JSON.parse(raw); } catch { data = {}; }
    res.json({
      response: (data.finalResponse ?? "I'm here for you. Tell me what's going on.").trim(),
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
      res.status(429).json({
        error: "All AI models are currently busy. Please wait a minute and try again.",
      });
      return;
    }
    res.status(500).json({ error: "Failed to get response from Saathi" });
  }
});

export default router;