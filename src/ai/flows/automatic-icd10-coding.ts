'use server';

/**
 * @fileOverview This file defines a Genkit flow for automatically generating ICD-10 codes from doctor's notes.
 *
 * - automaticICD10Coding - A function that handles the ICD-10 code generation process.
 * - AutomaticICD10CodingInput - The input type for the automaticICD10Coding function.
 * - AutomaticICD10CodingOutput - The return type for the automaticICD10Coding function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AutomaticICD10CodingInputSchema = z.object({
  notes: z.string().describe('The doctor\'s notes from the consultation.'),
  diagnosis: z.string().describe('The diagnosis for the patient.'),
});
export type AutomaticICD10CodingInput = z.infer<typeof AutomaticICD10CodingInputSchema>;

const AutomaticICD10CodingOutputSchema = z.object({
  icd10Codes: z.array(z.string()).describe('The list of ICD-10 codes generated for the diagnosis.'),
});
export type AutomaticICD10CodingOutput = z.infer<typeof AutomaticICD10CodingOutputSchema>;

export async function automaticICD10Coding(input: AutomaticICD10CodingInput): Promise<AutomaticICD10CodingOutput> {
  return automaticICD10CodingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'automaticICD10CodingPrompt',
  input: {schema: AutomaticICD10CodingInputSchema},
  output: {schema: AutomaticICD10CodingOutputSchema},
  prompt: `You are an expert medical coder. Given the doctor's notes and the diagnosis, generate a list of relevant ICD-10 codes.

Doctor's Notes: {{{notes}}}
Diagnosis: {{{diagnosis}}}

ICD-10 Codes:`,
});

const automaticICD10CodingFlow = ai.defineFlow(
  {
    name: 'automaticICD10CodingFlow',
    inputSchema: AutomaticICD10CodingInputSchema,
    outputSchema: AutomaticICD10CodingOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
