import { genkit } from "genkit";
import { googleAI } from "@genkit-ai/google-genai";

// DO NOT set a default model here.
// Prompts should control models individually.

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY,
    }),
  ],
});
