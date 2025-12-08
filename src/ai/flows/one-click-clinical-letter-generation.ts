'use server';

/**
 * @fileOverview A flow for generating clinical letters with one click.
 *
 * - generateClinicalLetter - A function that generates a clinical letter based on the provided input.
 * - ClinicalLetterInput - The input type for the generateClinicalLetter function.
 * - ClinicalLetterOutput - The return type for the generateClinicalLetter function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ClinicalLetterType = z.enum([
  'Referral Letter',
  'Discharge Summary',
  'Admission Note',
  'Motivational Letter',
  'Summary Report',
]);

const ClinicalLetterInputSchema = z.object({
  patientId: z.string().describe('The ID of the patient.'),
  letterType: ClinicalLetterType.describe('The type of clinical letter to generate.'),
  additionalContext: z.string().optional().describe('Any additional context to include in the letter.'),
});
export type ClinicalLetterInput = z.infer<typeof ClinicalLetterInputSchema>;

const ClinicalLetterOutputSchema = z.object({
  letter: z.string().describe('The generated clinical letter.'),
});
export type ClinicalLetterOutput = z.infer<typeof ClinicalLetterOutputSchema>;

export async function generateClinicalLetter(input: ClinicalLetterInput): Promise<ClinicalLetterOutput> {
  return generateClinicalLetterFlow(input);
}

const prompt = ai.definePrompt({
  name: 'clinicalLetterPrompt',
  input: {schema: ClinicalLetterInputSchema},
  output: {schema: ClinicalLetterOutputSchema},
  prompt: `You are an AI assistant specializing in generating clinical letters for doctors.

  You will generate a clinical letter of type "{{{letterType}}}" for patient with ID {{{patientId}}}.

  Use the structured patient data where applicable to ensure accuracy and relevance.

  Any additional context provided: {{{additionalContext}}}
  
  Make sure the language is medically accurate, and the letter is well-formatted and professional.
  `,
});

const generateClinicalLetterFlow = ai.defineFlow(
  {
    name: 'generateClinicalLetterFlow',
    inputSchema: ClinicalLetterInputSchema,
    outputSchema: ClinicalLetterOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
