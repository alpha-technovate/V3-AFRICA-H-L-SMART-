'use server';

/**
 * @fileOverview Interprets medical scans (X-rays, ECGs, PDFs, images) and generates findings.
 *
 * - medicalScanAIInterpretation - A function that interprets medical scans and generates findings.
 * - MedicalScanAIInterpretationInput - The input type for the medicalScanAIInterpretation function.
 * - MedicalScanAIInterpretationOutput - The return type for the medicalScanAIInterpretation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MedicalScanAIInterpretationInputSchema = z.object({
  scanDataUri: z
    .string()
    .describe(
      "A medical scan (X-ray, ECG, PDF, image) as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  scanType: z.string().describe('The type of medical scan (e.g., X-ray, ECG, PDF).'),
  patientContext: z.string().optional().describe('Contextual information about the patient.'),
});
export type MedicalScanAIInterpretationInput = z.infer<typeof MedicalScanAIInterpretationInputSchema>;

const MedicalScanAIInterpretationOutputSchema = z.object({
  findings: z.string().describe('The AI-generated findings from the medical scan.'),
  icd10Codes: z.array(z.string()).describe('ICD-10 codes associated with the findings.'),
});
export type MedicalScanAIInterpretationOutput = z.infer<typeof MedicalScanAIInterpretationOutputSchema>;

export async function medicalScanAIInterpretation(input: MedicalScanAIInterpretationInput): Promise<MedicalScanAIInterpretationOutput> {
  return medicalScanAIInterpretationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'medicalScanAIInterpretationPrompt',
  input: {schema: MedicalScanAIInterpretationInputSchema},
  output: {schema: MedicalScanAIInterpretationOutputSchema},
  prompt: `You are an AI assistant specializing in interpreting medical scans and generating findings.

  Analyze the provided medical scan and generate a detailed report of your findings.
  Also, generate relevant ICD-10 codes based on your analysis.

  Type of Scan: {{{scanType}}}
  Patient Context: {{{patientContext}}}
  Scan Data: {{media url=scanDataUri}}

  Your findings should be comprehensive and provide insights into potential medical conditions.
  Ensure that the generated ICD-10 codes accurately reflect the diagnoses.
  Findings:
  ICD-10 Codes:`, 
});

const medicalScanAIInterpretationFlow = ai.defineFlow(
  {
    name: 'medicalScanAIInterpretationFlow',
    inputSchema: MedicalScanAIInterpretationInputSchema,
    outputSchema: MedicalScanAIInterpretationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
