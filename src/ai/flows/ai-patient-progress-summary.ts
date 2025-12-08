'use server';

/**
 * @fileOverview Generates a patient progress summary based on visit history.
 *
 * - generatePatientProgressSummary - A function that generates the patient progress summary.
 * - GeneratePatientProgressSummaryInput - The input type for the generatePatientProgressSummary function.
 * - GeneratePatientProgressSummaryOutput - The return type for the generatePatientProgressSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePatientProgressSummaryInputSchema = z.object({
  patientHistory: z.string().describe('The patient visit history.'),
});
export type GeneratePatientProgressSummaryInput = z.infer<typeof GeneratePatientProgressSummaryInputSchema>;

const GeneratePatientProgressSummaryOutputSchema = z.object({
  summary: z.string().describe('The generated patient progress summary.'),
});
export type GeneratePatientProgressSummaryOutput = z.infer<typeof GeneratePatientProgressSummaryOutputSchema>;

export async function generatePatientProgressSummary(input: GeneratePatientProgressSummaryInput): Promise<GeneratePatientProgressSummaryOutput> {
  return generatePatientProgressSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePatientProgressSummaryPrompt',
  input: {schema: GeneratePatientProgressSummaryInputSchema},
  output: {schema: GeneratePatientProgressSummaryOutputSchema},
  prompt: `You are an AI assistant that generates a concise patient progress summary based on their visit history.  Given the following patient history, generate a Patient Progress Summary.

Patient History: {{{patientHistory}}}`,
});

const generatePatientProgressSummaryFlow = ai.defineFlow(
  {
    name: 'generatePatientProgressSummaryFlow',
    inputSchema: GeneratePatientProgressSummaryInputSchema,
    outputSchema: GeneratePatientProgressSummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return {
      summary: output!.summary
    };
  }
);
