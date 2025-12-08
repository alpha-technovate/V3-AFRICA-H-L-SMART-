'use server';

/**
 * @fileOverview Summarizes message threads or highlights clinical decisions from conversations in the internal messaging system.
 *
 * - summarizeMessageThread - A function that handles the message thread summarization process.
 * - SummarizeMessageThreadInput - The input type for the summarizeMessageThread function.
 * - SummarizeMessageThreadOutput - The return type for the summarizeMessageThread function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeMessageThreadInputSchema = z.object({
  messageThread: z
    .string()
    .describe('The complete message thread to summarize.'),
});
export type SummarizeMessageThreadInput = z.infer<typeof SummarizeMessageThreadInputSchema>;

const SummarizeMessageThreadOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the message thread.'),
  clinicalDecisions: z
    .string()
    .describe('Highlighted clinical decisions made during the conversation.'),
});
export type SummarizeMessageThreadOutput = z.infer<typeof SummarizeMessageThreadOutputSchema>;

export async function summarizeMessageThread(
  input: SummarizeMessageThreadInput
): Promise<SummarizeMessageThreadOutput> {
  return summarizeMessageThreadFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeMessageThreadPrompt',
  input: {schema: SummarizeMessageThreadInputSchema},
  output: {schema: SummarizeMessageThreadOutputSchema},
  prompt: `You are an AI assistant helping doctors and staff quickly catch up on internal message threads.

  Your task is to summarize the provided message thread and highlight any clinical decisions made.

  Message Thread:
  {{messageThread}}

  Summary:
  Clinical Decisions:`, // The LLM will continue from here.
});

const summarizeMessageThreadFlow = ai.defineFlow(
  {
    name: 'summarizeMessageThreadFlow',
    inputSchema: SummarizeMessageThreadInputSchema,
    outputSchema: SummarizeMessageThreadOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
