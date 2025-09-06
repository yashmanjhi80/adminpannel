'use server';

import { z } from 'zod';
import { createHash } from 'crypto';
import type { PendingTransaction } from './definitions';

const FormSchema = z.object({
  transactionId: z.string(),
  status: z.enum(['SUCCESSFUL', 'FAILED']),
});

const API_CONFIG = {
  providercode: 'JE',
  operatorcode: 'i4bi',
  secret_key: '904c3acfdc028f495ccc5b60d01dcc49',
};

// This is a mock function to simulate fetching user password
// In a real app, this would come from your database securely
const getUserPassword = async (username: string) => {
  return 'user-password-123';
};

// Mock API call simulation
const makeTransferApiCall = async (
  payload: Record<string, string | number>
) => {
  console.log('Simulating API call with payload:', payload);
  // Simulate different responses for demonstration
  if (payload.amount === 101) {
    // Specific amount to trigger unknown status
    return { errCode: '997', errMsg: 'Unknown transaction status' };
  }

  // Simulate random failure
  if (Math.random() < 0.1) {
    return { errCode: '999', errMsg: 'System busy, status unknown' };
  }

  // Simulate success
  return { errCode: '0', errMsg: 'Success' };
};

export async function updateTransactionStatus(
  transaction: PendingTransaction,
  newStatus: 'SUCCESSFUL' | 'FAILED'
) {
  const validatedFields = FormSchema.safeParse({
    transactionId: transaction._id,
    status: newStatus,
  });

  if (!validatedFields.success) {
    return {
      error: 'Invalid fields.',
    };
  }
  
  if (newStatus === 'FAILED') {
     // Here you would update your database
    console.log(`Transaction ${transaction._id} marked as FAILED.`);
    return { success: 'Transaction marked as Failed.' };
  }

  try {
    const userPassword = await getUserPassword(transaction.username);
    const type = '0'; // 0 for deposit

    const signatureString = `${transaction.amount}${API_CONFIG.operatorcode}${userPassword}${API_CONFIG.providercode}${transaction.referenceid}${type}${transaction.username}${API_CONFIG.secret_key}`;
    const signature = createHash('md5')
      .update(signatureString)
      .digest('hex')
      .toUpperCase();

    const payload = {
      operatorcode: API_CONFIG.operatorcode,
      providercode: API_CONFIG.providercode,
      username: transaction.username,
      password: userPassword,
      referenceid: transaction.referenceid,
      type,
      amount: transaction.amount,
      signature,
    };

    const response = await makeTransferApiCall(payload);

    if (response.errCode === '0') {
      // In a real app, you would update transaction status and user wallet in DB
      console.log(
        `SUCCESS: Transaction ${transaction.referenceid} approved. Amount ${transaction.amount} deposited to ${transaction.username}'s wallet.`
      );
      return { success: 'Transaction approved and funds deposited successfully!' };
    } else {
      console.log(
        `API ERROR: Transaction ${transaction.referenceid} failed with code ${response.errCode}: ${response.errMsg}`
      );
      return { error: `API Error: ${response.errMsg} (Code: ${response.errCode})` };
    }
  } catch (error) {
    console.error('Server Action Error:', error);
    return { error: 'An unexpected server error occurred.' };
  }
}
