'use server';
/**
 * @fileOverview Enhances medical documents using AI.
 *
 * - aiEnhanceDocument - A function that enhances a document using AI.
 * - AIDocumentEnhancementInput - The input type for the aiEnhanceDocument function.
 * - AIDocumentEnhancementOutput - The return type for the aiEnhanceDocument function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AIDocumentEnhancementInputSchema = z.object({
  documentText: z
    .string()
    .describe('The medical document text to be enhanced.'),
});
export type AIDocumentEnhancementInput = z.infer<
  typeof AIDocumentEnhancementInputSchema
>;

const AIDocumentEnhancementOutputSchema = z.object({
  enhancedDocumentText: z
    .string()
    .describe('The enhanced medical document text.'),
});
export type AIDocumentEnhancementOutput = z.infer<
  typeof AIDocumentEnhancementOutputSchema
>;

export async function aiEnhanceDocument(
  input: AIDocumentEnhancementInput
): Promise<AIDocumentEnhancementOutput> {
  return aiEnhanceDocumentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiEnhanceDocumentPrompt',
  input: {schema: AIDocumentEnhancementInputSchema},
  output: {schema: AIDocumentEnhancementOutputSchema},
  prompt: `You are a medical document enhancement AI. You will receive a medical document, and you will enhance it by improving grammar, clarity, conciseness, and suggesting additional relevant information. Return only the enhanced document.

Original document:
{{{documentText}}}`,
});

const aiEnhanceDocumentFlow = ai.defineFlow(
  {
    name: 'aiEnhanceDocumentFlow',
    inputSchema: AIDocumentEnhancementInputSchema,
    outputSchema: AIDocumentEnhancementOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
