'use server';
/**
 * @fileOverview A flow that provides AI-assisted troubleshooting for transaction issues, 
 * specifically when encountering 'errCode' values of '997' or '999'.
 *
 * - aiAssistedTransactionTroubleshooting - A function that initiates the troubleshooting process.
 * - AiAssistedTransactionTroubleshootingInput - The input type for the aiAssistedTransactionTroubleshooting function.
 * - AiAssistedTransactionTroubleshootingOutput - The return type for the aiAssistedTransactionTroubleshooting function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiAssistedTransactionTroubleshootingInputSchema = z.object({
  errCode: z
    .string()
    .describe("The error code received from the transaction API.  Expected value '997' or '999'."),
  transactionDetails: z.string().describe('Details about the transaction, such as the transaction ID, user ID, amount, and timestamp.'),
});
export type AiAssistedTransactionTroubleshootingInput = z.infer<typeof AiAssistedTransactionTroubleshootingInputSchema>;

const AiAssistedTransactionTroubleshootingOutputSchema = z.object({
  troubleshootingSteps: z.string().describe('A detailed explanation of the recommended troubleshooting steps, including when to consult customer support.'),
});
export type AiAssistedTransactionTroubleshootingOutput = z.infer<typeof AiAssistedTransactionTroubleshootingOutputSchema>;

export async function aiAssistedTransactionTroubleshooting(input: AiAssistedTransactionTroubleshootingInput): Promise<AiAssistedTransactionTroubleshootingOutput> {
  return aiAssistedTransactionTroubleshootingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiAssistedTransactionTroubleshootingPrompt',
  input: {schema: AiAssistedTransactionTroubleshootingInputSchema},
  output: {schema: AiAssistedTransactionTroubleshootingOutputSchema},
  prompt: `You are an AI assistant designed to help troubleshoot transaction issues, especially when the transaction API returns an error code of 997 or 999, indicating an unknown transaction status.

  Based on the error code and transaction details provided, consult relevant documentation, internal notes, and external support resources to provide the admin with the best course of action.

  Specifically, consider these factors to make a determination as to the next steps:
  - Check for any known issues or outages with the payment provider.
  - Review internal documentation for handling error codes 997 and 999.
  - If necessary, provide instructions on how to gather additional information about the transaction.
  - Clearly indicate when it is necessary to contact customer support for further assistance.

  Error Code: {{{errCode}}}
  Transaction Details: {{{transactionDetails}}}

  Provide detailed troubleshooting steps:`, 
});

const aiAssistedTransactionTroubleshootingFlow = ai.defineFlow(
  {
    name: 'aiAssistedTransactionTroubleshootingFlow',
    inputSchema: AiAssistedTransactionTroubleshootingInputSchema,
    outputSchema: AiAssistedTransactionTroubleshootingOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
