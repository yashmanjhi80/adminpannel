
'use server';

import { z } from 'zod';
import { createHash } from 'crypto';
import type { PendingTransaction } from './definitions';
import { getUser, updateTransactionInDb, addDepositToDb } from './data';

const UpdateTransactionSchema = z.object({
  transactionId: z.string(),
  status: z.enum(['SUCCESSFUL', 'FAILED']),
});

// Schema for the editable form
const ManualApiRequestSchema = z.object({
  userId: z.string(), // Needed for DB updates
  apiUrl: z.string().url(),
  operatorcode: z.string(),
  providercode: z.string(),
  username: z.string(),
  password: z.string(),
  referenceid: z.string(),
  type: z.string(),
  amount: z.coerce.number(),
  signature: z.string().optional(),
});


const API_CONFIG = {
  // secret_key is still needed for server-side signature generation
  secret_key: process.env.API_SECRET_KEY || '904c3acfdc028f495ccc5b60d01dcc49',
};

const makeTransferApiCall = async (
  apiUrl: string,
  payload: Record<string, string | number>
) => {
  const params = new URLSearchParams();
  for (const key in payload) {
    // Do not add signature to params yet, it's part of the final URL
    if (key !== 'signature') {
      params.append(key, String(payload[key]));
    }
  }

  // Signature must be the last parameter
  params.append('signature', String(payload.signature));
  
  const requestUrl = `${apiUrl}?${params.toString()}`;
  console.log(`[API_CALL] Requesting URL: ${requestUrl}`);

  try {
    const response = await fetch(requestUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const responseText = await response.text();
    console.log(`[API_CALL] Response Status: ${response.status}`);
    console.log(`[API_CALL] Response Body: ${responseText}`);

    if (!response.ok) {
        // Return the raw text as error message if response is not ok
        return { errCode: response.status.toString(), errMsg: responseText };
    }

    try {
        // Attempt to parse JSON, if it fails, return raw text
        return JSON.parse(responseText);
    } catch (e) {
        return { errCode: '998', errMsg: `Invalid JSON response: ${responseText}` };
    }
    
  } catch (error) {
    console.error("[API_CALL_ERROR]", error);
    if (error instanceof Error) {
        return { errCode: '999', errMsg: `Network error: ${error.message}` };
    }
    return { errCode: '999', errMsg: 'An unknown network error occurred.' };
  }
};

export async function updateTransactionStatus(
  transaction: PendingTransaction,
  newStatus: 'SUCCESSFUL' | 'FAILED'
) {
  const validatedFields = UpdateTransactionSchema.safeParse({
    transactionId: transaction._id,
    status: newStatus,
  });

  if (!validatedFields.success) {
    return { error: 'Invalid fields.' };
  }
  
  if (newStatus === 'FAILED') {
    await updateTransactionInDb(transaction._id, 'FAILED', null);
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
    
    const defaultApiUrl = 'http://gsmd.336699bet.com/makeTransfer.aspx';
    const response = await makeTransferApiCall(defaultApiUrl, payload);

    if (!response || !('errCode' in response)) {
      return { error: 'API call failed: Invalid response from provider.' };
    }
    
    if (response.errCode === '0') {
      const { newBalance } = await updateTransactionInDb(transaction._id, 'SUCCESSFUL', transaction.referenceid);
      console.log(`SUCCESS: Transaction ${transaction.referenceid} approved. Amount ${transaction.amount} deposited to ${transaction.username}'s wallet.`);
      return { success: 'Transaction approved and funds deposited successfully!', newBalance };
    } else {
      await updateTransactionInDb(transaction._id, 'FAILED', null);
      console.log(`API ERROR: Transaction ${transaction.referenceid} failed with code ${response.errCode}: ${response.errMsg}`);
      return { error: `API Error: ${response.errMsg} (Code: ${response.errCode})` };
    }
  } catch (error) {
    console.error('Server Action Error:', error);
    if (error instanceof Error) {
        return { error: error.message };
    }
    return { error: 'An unexpected server error occurred.' };
  }
}

export async function addMoneyToWallet(prevState: any, formData: FormData) {
  const validatedFields = ManualApiRequestSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
      const errorMessages = validatedFields.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('; ');
      return { error: `Invalid data provided: ${errorMessages}` };
  }

  const { userId, apiUrl, ...payload } = validatedFields.data;

  try {
      // If signature is not provided by the user, generate it on the server
      if (!payload.signature) {
          const { amount, operatorcode, password, providercode, referenceid, type, username } = payload;
          const signatureString = `${amount}${operatorcode}${password}${providercode}${referenceid}${type}${username}${API_CONFIG.secret_key}`;
          payload.signature = createHash('md5').update(signatureString).digest('hex').toUpperCase();
          console.log(`[SERVER_SIGN] Generated signature: ${payload.signature}`);
      } else {
          console.log(`[USER_SIGN] Using user-provided signature: ${payload.signature}`);
      }

      const response = await makeTransferApiCall(apiUrl, payload);

      if (!response || typeof response.errCode === 'undefined') {
        return { error: 'API call failed: Received an invalid or empty response from the provider.' };
      }
      
      if (response.errCode === '0') {
          const newBalance = await addDepositToDb({
              orderId: payload.referenceid,
              username: payload.username,
              amount: payload.amount,
              money: payload.amount.toString(),
              status: 'SUCCESSFUL',
              createdAt: new Date(),
          });
          console.log(`SUCCESS: Manual deposit of ${payload.amount} for ${payload.username} successful.`);
          return { success: `Successfully deposited ₹${payload.amount.toLocaleString()} to ${payload.username}'s wallet.`, newBalance };
      } else {
          console.log(`API ERROR: Manual deposit for ${payload.username} failed with code ${response.errCode}: ${response.errMsg}`);
          return { error: `API Error: ${response.errMsg || 'Unknown error.'} (Code: ${response.errCode})` };
      }
  } catch (error) {
      console.error('Add Money Server Action Error:', error);
       if (error instanceof Error) {
        return { error: error.message };
    }
    return { error: 'An unexpected server error occurred.' };
  }
}
