
'use server';

import { z } from 'zod';
import { createHash } from 'crypto';
import type { PendingTransaction, Transaction } from './definitions';
import { getUser, updateTransactionInDb, addDepositToDb } from './data';
import { format } from 'date-fns';


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
  signature: z.string(),
});


const API_CONFIG = {
  // secret_key is still needed for server-side signature generation
  secret_key: process.env.API_SECRET_KEY || '904c3acfdc028f495ccc5b60d01dcc49',
  lg_pay_secret: process.env.LG_PAY_SECRET || 'l8BlAeUb5Bd3zwGHCvLs3GNSFRKJ71nL',
};

const makeTransferApiCall = async (
  apiUrl: string,
  payload: Record<string, string | number>
) => {
  const params = new URLSearchParams();
  for (const key in payload) {
    params.append(key, String(payload[key]));
  }

  // Signature must be the last parameter for this specific API
  if (payload.signature) {
    params.delete('signature');
    params.append('signature', String(payload.signature));
  }
  
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
      return { errCode: response.status.toString(), errMsg: `Request failed with status ${response.status}: ${responseText}` };
    }

    try {
      return JSON.parse(responseText);
    } catch (e) {
      // If parsing fails, it could be a non-JSON success/error message
      // Return a specific error code for non-JSON responses
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

export async function approveTransaction(transaction: Transaction) {
  const CALLBACK_URL = 'https://game.zyronetworks.shop/payment-callback';
  
  const payload: Record<string, any> = {
    order_sn: transaction.orderId,
    money: transaction.amount.toFixed(2),
    status: '1',
    pay_time: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
    remark: 'ManualApproval',
  };

  const sortedKeys = Object.keys(payload).sort();
  const stringA = sortedKeys.map(key => `${key}=${payload[key]}`).join('&');
  const stringToSign = `${stringA}&key=${API_CONFIG.lg_pay_secret}`;
  payload.sign = createHash('md5').update(stringToSign).digest('hex').toUpperCase();

  console.log(`[CALLBACK_CALL] Sending approval for order: ${payload.order_sn}`);
  console.log(`[CALLBACK_CALL] Payload:`, payload);

  try {
    const response = await fetch(CALLBACK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(payload),
    });

    const responseText = await response.text();
    console.log(`[CALLBACK_CALL] Response Status: ${response.status}`);
    console.log(`[CALLBACK_CALL] Response Body: ${responseText}`);

    if (response.ok && responseText.toLowerCase().includes('ok')) {
      return { success: `Transaction ${transaction.orderId} successfully approved.` };
    } else {
      return { error: `Callback failed with status ${response.status}: ${responseText}` };
    }
  } catch (error) {
    console.error('[CALLBACK_CALL_ERROR]', error);
    if (error instanceof Error) {
      return { error: `Network error: ${error.message}` };
    }
    return { error: 'An unknown network error occurred while calling the callback.' };
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
      const apiResponse = await makeTransferApiCall(apiUrl, payload);

      if (!apiResponse || typeof apiResponse.errCode === 'undefined') {
          return { error: 'API call failed: Received an invalid or empty response from the provider.' };
      }
      
      if (apiResponse.errCode === '0') {
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
          console.log(`API ERROR: Manual deposit for ${payload.username} failed with code ${apiResponse.errCode}: ${apiResponse.errMsg}`);
          return { error: `API Error: ${apiResponse.errMsg || 'Unknown error.'} (Code: ${apiResponse.errCode})` };
      }
  } catch (error) {
      console.error('Add Money Server Action Error:', error);
       if (error instanceof Error) {
        return { error: error.message };
    }
    return { error: 'An unexpected server error occurred.' };
  }
}
