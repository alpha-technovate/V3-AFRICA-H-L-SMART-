'use server';

/**
 * @fileOverview Generates a specialist referral letter using patient data.
 *
 * - generateSpecialistReferralLetter - A function that generates the referral letter.
 * - SpecialistReferralLetterInput - The input type for the generateSpecialistReferralLetter function.
 * - SpecialistReferralLetterOutput - The return type for the generateSpecialistReferralLetter function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SpecialistReferralLetterInputSchema = z.object({
  patientName: z.string().describe('The name of the patient.'),
  patientId: z.string().describe('The ID of the patient.'),
  patientHistory: z.string().describe('The medical history of the patient.'),
  specialistName: z.string().describe('The name of the specialist to whom the patient is being referred.'),
  reasonForReferral: z.string().describe('The reason for the referral.'),
  doctorName: z.string().describe('The name of the referring doctor.'),
  doctorSpecialty: z.string().describe('The specialty of the referring doctor.'),
});

export type SpecialistReferralLetterInput = z.infer<
  typeof SpecialistReferralLetterInputSchema
>;

const SpecialistReferralLetterOutputSchema = z.object({
  referralLetter: z.string().describe('The generated specialist referral letter.'),
});

export type SpecialistReferralLetterOutput = z.infer<
  typeof SpecialistReferralLetterOutputSchema
>;

export async function generateSpecialistReferralLetter(
  input: SpecialistReferralLetterInput
): Promise<SpecialistReferralLetterOutput> {
  return specialistReferralLetterFlow(input);
}

const prompt = ai.definePrompt({
  name: 'specialistReferralLetterPrompt',
  input: {schema: SpecialistReferralLetterInputSchema},
  output: {schema: SpecialistReferralLetterOutputSchema},
  prompt: `You are an AI assistant that generates specialist referral letters for doctors.

  Given the following patient data, specialist information and reason for referral, generate a comprehensive and professional referral letter.

  Patient Name: {{{patientName}}}
  Patient ID: {{{patientId}}}
  Patient Medical History: {{{patientHistory}}}
  Specialist Name: {{{specialistName}}}
  Reason for Referral: {{{reasonForReferral}}}
  Referring Doctor Name: {{{doctorName}}}
  Referring Doctor Specialty: {{{doctorSpecialty}}}

  Referral Letter:
  `,
});

const specialistReferralLetterFlow = ai.defineFlow(
  {
    name: 'specialistReferralLetterFlow',
    inputSchema: SpecialistReferralLetterInputSchema,
    outputSchema: SpecialistReferralLetterOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
