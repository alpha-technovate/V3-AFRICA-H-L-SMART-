'use server';

/**
 * @fileOverview This file implements the Consultation Auto-Note Generator flow.
 *
 * It allows doctors to automatically generate notes for a patient consultation based on recorded audio or typed text.
 *
 * @exports {
 *   generateConsultationNotes - The main function to generate consultation notes.
 *   ConsultationNotesInput - The input type for the generateConsultationNotes function.
 *   ConsultationNotesOutput - The output type for the generateConsultationNotes function.
 * }
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ConsultationNotesInputSchema = z.object({
  text: z.string().describe('The recorded audio transcription or typed text from the consultation.'),
});

export type ConsultationNotesInput = z.infer<typeof ConsultationNotesInputSchema>;

const ConsultationNotesOutputSchema = z.object({
  notes: z.string().describe('The AI-generated notes for the patient consultation.'),
});

export type ConsultationNotesOutput = z.infer<typeof ConsultationNotesOutputSchema>;

export async function generateConsultationNotes(input: ConsultationNotesInput): Promise<ConsultationNotesOutput> {
  return consultationNotesFlow(input);
}

const consultationNotesPrompt = ai.definePrompt({
  name: 'consultationNotesPrompt',
  input: {schema: ConsultationNotesInputSchema},
  output: {schema: ConsultationNotesOutputSchema},
  prompt: `You are an AI assistant that generates notes based on patient consultation text.

  Generate concise and informative notes based on the following text:

  {{text}}
  `,
});

const consultationNotesFlow = ai.defineFlow(
  {
    name: 'consultationNotesFlow',
    inputSchema: ConsultationNotesInputSchema,
    outputSchema: ConsultationNotesOutputSchema,
  },
  async input => {
    const {output} = await consultationNotesPrompt(input);
    return output!;
  }
);
