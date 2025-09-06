// Summarize the details of a given transaction using GenAI, allowing admins to quickly understand transaction context.

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeTransactionDetailsInputSchema = z.object({
  transactionDetails: z.string().describe('Details of the transaction to summarize.'),
});

export type SummarizeTransactionDetailsInput = z.infer<
  typeof SummarizeTransactionDetailsInputSchema
>;

const SummarizeTransactionDetailsOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the transaction details.'),
});

export type SummarizeTransactionDetailsOutput = z.infer<
  typeof SummarizeTransactionDetailsOutputSchema
>;

export async function summarizeTransactionDetails(
  input: SummarizeTransactionDetailsInput
): Promise<SummarizeTransactionDetailsOutput> {
  return summarizeTransactionDetailsFlow(input);
}

const summarizeTransactionDetailsPrompt = ai.definePrompt({
  name: 'summarizeTransactionDetailsPrompt',
  input: {schema: SummarizeTransactionDetailsInputSchema},
  output: {schema: SummarizeTransactionDetailsOutputSchema},
  prompt: `Summarize the following transaction details in a concise manner:

{{{transactionDetails}}}`,
});

const summarizeTransactionDetailsFlow = ai.defineFlow(
  {
    name: 'summarizeTransactionDetailsFlow',
    inputSchema: SummarizeTransactionDetailsInputSchema,
    outputSchema: SummarizeTransactionDetailsOutputSchema,
  },
  async input => {
    const {output} = await summarizeTransactionDetailsPrompt(input);
    return output!;
  }
);
