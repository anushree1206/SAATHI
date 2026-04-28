import { GoogleGenAI } from "@google/genai";

let _ai: GoogleGenAI | null = null;

export function getAI(): GoogleGenAI {
  if (process.env.GEMINI_API_KEY) {
    if (!_ai) {
      _ai = new GoogleGenAI(process.env.GEMINI_API_KEY);
    }
    return _ai;
  } else {
    throw new Error("GEMINI_API_KEY must be set.");
  }
}

// For backward compatibility, export a lazy-loaded ai object
export const ai = new Proxy({} as GoogleGenAI, {
  get: (_target, prop) => {
    return Reflect.get(getAI(), prop as PropertyKey);
  },
});
