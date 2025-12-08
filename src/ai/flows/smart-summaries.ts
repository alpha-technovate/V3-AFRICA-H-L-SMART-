'use server';

/**
 * @fileOverview Implements the Smart Summaries feature, generating AI summaries for patients, grouped by condition or recent activity.
 *
 * - generateSystemSummary - Generates a summary of the overall system status.
 * - generateConditionSummary - Generates a summary of patients grouped by condition.
 * - generatePatientSummary - Generates a summary for a specific patient.
 * - SmartSummariesInput - The input type for the generate functions.
 * - SmartSummariesOutput - The return type for the generate functions.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SmartSummariesInputSchema = z.object({
  patientData: z.string().describe('A summary of all the patient data.'),
  condition: z.string().optional().describe('The specific condition to summarize patients by.'),
  patientId: z.string().optional().describe('The ID of the patient to summarize.'),
});
export type SmartSummariesInput = z.infer<typeof SmartSummariesInputSchema>;

const SmartSummariesOutputSchema = z.object({
  summary: z.string().describe('The generated AI summary.'),
});
export type SmartSummariesOutput = z.infer<typeof SmartSummariesOutputSchema>;

const smartSummariesPrompt = ai.definePrompt({
  name: 'smartSummariesPrompt',
  input: {schema: SmartSummariesInputSchema},
  output: {schema: SmartSummariesOutputSchema},
  prompt: `You are an AI assistant designed to generate summaries for patient data.

  {% if patientId %}
  Generate a summary for the patient with ID: {{{patientId}}}.
  {% elif condition %}
  Generate a summary of patients with the condition: {{{condition}}}.
  {% else %}
  Generate an overall system summary of all patient data.
  {% endif %}

  Patient Data: {{{patientData}}}
  `,
});

const smartSummariesFlow = ai.defineFlow(
  {
    name: 'smartSummariesFlow',
    inputSchema: SmartSummariesInputSchema,
    outputSchema: SmartSummariesOutputSchema,
  },
  async input => {
    const {output} = await smartSummariesPrompt(input);
    return output!;
  }
);

export async function generateSystemSummary(input: SmartSummariesInput): Promise<SmartSummariesOutput> {
  return smartSummariesFlow(input);
}

export async function generateConditionSummary(input: SmartSummariesInput): Promise<SmartSummariesOutput> {
  return smartSummariesFlow(input);
}

export async function generatePatientSummary(input: SmartSummariesInput): Promise<SmartSummariesOutput> {
  return smartSummariesFlow(input);
}
