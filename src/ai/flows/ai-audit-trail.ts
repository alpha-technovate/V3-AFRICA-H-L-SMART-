'use server';

/**
 * @fileOverview AI Audit Trail flow to log AI actions for auditing and compliance.
 *
 * - logAiAction - Logs AI actions with details like changed values, doctor, and timestamp.
 * - LogAiActionInput - The input type for the logAiAction function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const LogAiActionInputSchema = z.object({
  changedField: z.string().describe('The field that was changed by the AI.'),
  previousValue: z.any().describe('The previous value of the field.'),
  newValue: z.any().describe('The new value of the field after AI action.'),
  doctor: z.string().describe('The ID of the doctor who triggered the AI action.'),
  timestamp: z.string().describe('The timestamp of when the AI action occurred.'),
});

export type LogAiActionInput = z.infer<typeof LogAiActionInputSchema>;

export async function logAiAction(input: LogAiActionInput): Promise<void> {
  await logAiActionFlow(input);
}

const logAiActionFlow = ai.defineFlow(
  {
    name: 'logAiActionFlow',
    inputSchema: LogAiActionInputSchema,
    outputSchema: z.void(),
  },
  async input => {
    // Persist the log to Firestore here; using ai.log for now as a placeholder.
    ai.log('AI Audit Log:', input);
    // TODO: Integrate with Firestore to store the audit log.
  }
);
