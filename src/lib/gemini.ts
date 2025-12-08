import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("❌ Missing GEMINI_API_KEY in environment variables");
}

export const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Default stable model for 2025
export const gemini = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
});

// Universal text extractor (works for ALL response formats)
export function extractGeminiText(resp: any) {
  try {
    if (!resp) return "";
    if (typeof resp.text === "function") return resp.text() ?? "";
    if (typeof resp.text === "string") return resp.text ?? "";

    return (
      resp.candidates?.[0]?.content?.parts?.[0]?.text ??
      resp.candidates?.[0]?.content?.parts?.[0]?.content ??
      ""
    );
  } catch (e) {
    console.error("TEXT EXTRACTION ERROR:", e);
    return "";
  }
}
