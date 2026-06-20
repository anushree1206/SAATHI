import { GoogleGenAI } from "@google/genai";

let _ai: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY must be set in .env");
  }
  if (!_ai) {
    _ai = new GoogleGenAI(process.env.GEMINI_API_KEY);
  }
  return _ai;
}

export const ai = new Proxy({} as GoogleGenAI, {
  get: (_target, prop) => Reflect.get(getAI(), prop as PropertyKey),
});

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

export async function callGemini(
  opts: Omit<Parameters<typeof ai.models.generateContent>[0], "model">,
) {
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
        console.error(`[Gemini] ${model} failed: ${msg}`);

        if (isRateLimit) { break; }
        if (isOverloaded && attempt === 0) {
          await new Promise((r) => setTimeout(r, 800));
          continue;
        }
        if (!isRateLimit && !isOverloaded) { throw err; }
        break;
      }
    }
  }

  const error = new AllModelsExhaustedError();
  (error as any).cause = lastError;
  throw error;
}
