'use server';

/**
 * @fileOverview An AI agent that leverages patient history to intelligently update patient information.
 *
 * - perPatientIntelligentContext - A function that handles the intelligent context updates for a specific patient.
 * - PerPatientIntelligentContextInput - The input type for the perPatientIntelligentContext function.
 * - PerPatientIntelligentContextOutput - The return type for the perPatientIntelligentContext function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PerPatientIntelligentContextInputSchema = z.object({
  patientId: z.string().describe('The ID of the patient.'),
  query: z.string().describe('The query to use to determine how to update patient information.'),
  patientHistory: z.string().describe('A summary of the patient history.'),
});
export type PerPatientIntelligentContextInput = z.infer<typeof PerPatientIntelligentContextInputSchema>;

const PerPatientIntelligentContextOutputSchema = z.object({
  updatedInformation: z.string().describe('The updated patient information based on the query and patient history.'),
});
export type PerPatientIntelligentContextOutput = z.infer<typeof PerPatientIntelligentContextOutputSchema>;

export async function perPatientIntelligentContext(
  input: PerPatientIntelligentContextInput
): Promise<PerPatientIntelligentContextOutput> {
  return perPatientIntelligentContextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'perPatientIntelligentContextPrompt',
  input: {schema: PerPatientIntelligentContextInputSchema},
  output: {schema: PerPatientIntelligentContextOutputSchema},
  prompt: `You are an AI assistant that leverages patient history to intelligently update patient information. You will receive a query and the patient's history. Based on the query and history, determine what information needs to be updated and return the updated information.

Patient History: {{{patientHistory}}}

Query: {{{query}}}`,
});

const perPatientIntelligentContextFlow = ai.defineFlow(
  {
    name: 'perPatientIntelligentContextFlow',
    inputSchema: PerPatientIntelligentContextInputSchema,
    outputSchema: PerPatientIntelligentContextOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
