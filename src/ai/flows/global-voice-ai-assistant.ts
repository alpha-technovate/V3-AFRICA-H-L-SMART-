'use server';

import { ai } from "@/ai/genkit";
import { z } from "genkit";

// ---------------------
// SCHEMAS
// ---------------------
const GlobalVoiceAssistantInputSchema = z.object({
  voiceInput: z.string().describe("The voice input transcribed as text."),
  context: z.string().optional().describe("Current app context."),
  patientId: z.string().optional().describe("Patient ID."),
});
export type GlobalVoiceAssistantInput = z.infer<
  typeof GlobalVoiceAssistantInputSchema
>;

const GlobalVoiceAssistantOutputSchema = z.object({
  updatedFields: z.record(z.string(), z.any()),
  actionTaken: z.string(),
});
export type GlobalVoiceAssistantOutput = z.infer<
  typeof GlobalVoiceAssistantOutputSchema
>;

// ---------------------
// PROMPT — MODEL GOES HERE ✔
// ---------------------
const prompt = ai.definePrompt({
  name: "globalVoiceAssistantPrompt",
  model: "gemini-1.5-flash",   // ✔ the CORRECT place for model
  input: { schema: GlobalVoiceAssistantInputSchema },
  output: { schema: GlobalVoiceAssistantOutputSchema },
  prompt: `
You are a helpful AI assistant that interprets voice commands from a doctor
and updates the appropriate fields in a medical application.

Voice Input: {{{voiceInput}}}
Context: {{{context}}}
Patient ID: {{{patientId}}}

Return ONLY valid JSON with:
{
  "updatedFields": { ... },
  "actionTaken": "..."
}
`,
});

// ---------------------
// FLOW — DO NOT PUT MODEL HERE ❌
// ---------------------
const globalVoiceAssistantFlow = ai.defineFlow(
  {
    name: "globalVoiceAssistantFlow",
    inputSchema: GlobalVoiceAssistantInputSchema,
    outputSchema: GlobalVoiceAssistantOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);

// ---------------------
// EXPORTED FUNCTION
// ---------------------
export async function globalVoiceAssistant(
  input: GlobalVoiceAssistantInput
): Promise<GlobalVoiceAssistantOutput> {
  return globalVoiceAssistantFlow(input);
}
