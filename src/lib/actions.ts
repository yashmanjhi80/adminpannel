'use server';

import { z } from 'zod';
import { createHash } from 'crypto';
import type { PendingTransaction } from './definitions';
import { getUser, updateTransactionInDb } from './data';

const FormSchema = z.object({
  transactionId: z.string(),
  status: z.enum(['SUCCESSFUL', 'FAILED']),
});

const API_CONFIG = {
  providercode: 'JE',
  operatorcode: 'i4bi',
  secret_key: process.env.API_SECRET_KEY || '904c3acfdc028f495ccc5b60d01dcc49',
};

const API_URL = 'http://gsmd.336699bet.com/makeTransfer.aspx';

const makeTransferApiCall = async (
  payload: Record<string, string | number>
) => {
  const params = new URLSearchParams();
  for (const key in payload) {
    params.append(key, String(payload[key]));
  }

  try {
    const response = await fetch(`${API_URL}?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`API call failed with status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("API Call Error:", error);
    // In case of network error, simulate an unknown status as per docs
    return { errCode: '999', errMsg: 'Network error, status unknown' };
  }
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
    return { error: 'Invalid fields.' };
  }
  
  if (newStatus === 'FAILED') {
    await updateTransactionInDb(transaction._id, 'FAILED');
    console.log(`Transaction ${transaction._id} marked as FAILED.`);
    return { success: 'Transaction marked as Failed.' };
  }

  try {
    const user = await getUser(transaction.username);
    if (!user || !user.password) {
      return { error: `User ${transaction.username} not found or has no password.` };
    }
    const userPassword = user.password;
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
      await updateTransactionInDb(transaction._id, 'SUCCESSFUL');
      console.log(`SUCCESS: Transaction ${transaction.referenceid} approved. Amount ${transaction.amount} deposited to ${transaction.username}'s wallet.`);
      return { success: 'Transaction approved and funds deposited successfully!' };
    } else if (['997', '999'].includes(response.errCode)) {
       // As per docs, for unknown status, we should withhold funds and check later.
       // For this admin panel, we will treat it as a temporary failure and ask admin to retry.
      console.log(`UNKNOWN STATUS: Transaction ${transaction.referenceid} status unknown with code ${response.errCode}: ${response.errMsg}`);
      return { error: `Transaction status is unknown. Please check with the provider or retry later. (Code: ${response.errCode})` };
    }
    else {
      // Any other error code is a definitive failure
      await updateTransactionInDb(transaction._id, 'FAILED');
      console.log(`API ERROR: Transaction ${transaction.referenceid} failed with code ${response.errCode}: ${response.errMsg}`);
      return { error: `API Error: ${response.errMsg} (Code: ${response.errCode})` };
    }
  } catch (error) {
    console.error('Server Action Error:', error);
    return { error: 'An unexpected server error occurred.' };
  }
}