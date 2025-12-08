'use server';

/**
 * @fileOverview This file contains the Genkit flow for automatically filling
 * new patient information from an ID photo.
 *
 * - newPatientAutofillFromIDPhoto - A function that handles the patient data extraction process.
 * - NewPatientAutofillFromIDPhotoInput - The input type for the newPatientAutofillFromIDPhoto function.
 * - NewPatientAutofillFromIDPhotoOutput - The return type for the newPatientAutofillFromIDPhoto function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const NewPatientAutofillFromIDPhotoInputSchema = z.object({
  idPhotoDataUri: z
    .string()
    .describe(
      "A photo of a patient's ID, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type NewPatientAutofillFromIDPhotoInput = z.infer<typeof NewPatientAutofillFromIDPhotoInputSchema>;

const NewPatientAutofillFromIDPhotoOutputSchema = z.object({
  firstName: z.string().describe('The first name of the patient.'),
  lastName: z.string().describe('The last name of the patient.'),
  dateOfBirth: z.string().describe('The date of birth of the patient in ISO format (YYYY-MM-DD).'),
  address: z.string().describe('The full address of the patient.'),
  gender: z.string().describe('The gender of the patient.'),
});
export type NewPatientAutofillFromIDPhotoOutput = z.infer<typeof NewPatientAutofillFromIDPhotoOutputSchema>;

export async function newPatientAutofillFromIDPhoto(
  input: NewPatientAutofillFromIDPhotoInput
): Promise<NewPatientAutofillFromIDPhotoOutput> {
  return newPatientAutofillFromIDPhotoFlow(input);
}

const prompt = ai.definePrompt({
  name: 'newPatientAutofillFromIDPhotoPrompt',
  input: {schema: NewPatientAutofillFromIDPhotoInputSchema},
  output: {schema: NewPatientAutofillFromIDPhotoOutputSchema},
  prompt: `You are an expert AI assistant that helps doctors extract patient information from ID photos.
  Given an ID photo, extract the following information and return it in JSON format:

  - first name
  - last name
  - date of birth (YYYY-MM-DD)
  - address
  - gender

  Here is the ID photo:
  {{media url=idPhotoDataUri}}
  `,
});

const newPatientAutofillFromIDPhotoFlow = ai.defineFlow(
  {
    name: 'newPatientAutofillFromIDPhotoFlow',
    inputSchema: NewPatientAutofillFromIDPhotoInputSchema,
    outputSchema: NewPatientAutofillFromIDPhotoOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
