'use server';

/**
 * @fileOverview This file contains the Genkit flow for generating various patient reports.
 *
 * - generateReport - A function to generate a specific type of report for a patient.
 * - ReportType - An enum defining the types of reports that can be generated.
 * - GenerateReportInput - The input type for the generateReport function.
 * - GenerateReportOutput - The return type for the generateReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export enum ReportType {
  SummaryReportPDF = 'SummaryReportPDF',
  MotivationalLetter = 'MotivationalLetter',
  ReferralLetter = 'ReferralLetter',
  DischargeSummary = 'DischargeSummary',
  AdmissionNote = 'AdmissionNote',
}

const GenerateReportInputSchema = z.object({
  patientId: z.string().describe('The ID of the patient to generate the report for.'),
  reportType: z.nativeEnum(ReportType).describe('The type of report to generate.'),
});
export type GenerateReportInput = z.infer<typeof GenerateReportInputSchema>;

const GenerateReportOutputSchema = z.object({
  reportContent: z.string().describe('The generated content of the report.'),
});
export type GenerateReportOutput = z.infer<typeof GenerateReportOutputSchema>;

export async function generateReport(input: GenerateReportInput): Promise<GenerateReportOutput> {
  return generateReportFlow(input);
}

const reportGenerationPrompt = ai.definePrompt({
  name: 'reportGenerationPrompt',
  input: {
    schema: GenerateReportInputSchema,
  },
  output: {
    schema: GenerateReportOutputSchema,
  },
  prompt: `You are an AI assistant specializing in generating medical reports. Generate a report of type {{{reportType}}} for patient with ID {{{patientId}}}. Use structured data where available from the patient record to populate the report. Follow all formatting and style conventions appropriate for the specified report type.`,
});

const generateReportFlow = ai.defineFlow(
  {
    name: 'generateReportFlow',
    inputSchema: GenerateReportInputSchema,
    outputSchema: GenerateReportOutputSchema,
  },
  async input => {
    const {output} = await reportGenerationPrompt(input);
    return output!;
  }
);
