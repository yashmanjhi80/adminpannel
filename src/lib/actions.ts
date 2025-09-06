
'use server';

import { z } from 'zod';
import { createHash } from 'crypto';
import type { PendingTransaction } from './definitions';
import { getUser, updateTransactionInDb, addDepositToDb } from './data';

const UpdateTransactionSchema = z.object({
  transactionId: z.string(),
  status: z.enum(['SUCCESSFUL', 'FAILED']),
});

const AddMoneySchema = z.object({
  userId: z.string(),
  username: z.string(),
  amount: z.coerce.number().positive({ message: 'Amount must be positive.' }),
  referenceid: z.string(),
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
  const requestUrl = `${API_URL}?${params.toString()}`;
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
        return { errCode: response.status.toString(), errMsg: responseText };
    }

    try {
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

    const response = await makeTransferApiCall(payload);

    if (response.errCode === '0') {
      const { newBalance } = await updateTransactionInDb(transaction._id, 'SUCCESSFUL', transaction.referenceid);
      console.log(`SUCCESS: Transaction ${transaction.referenceid} approved. Amount ${transaction.amount} deposited to ${transaction.username}'s wallet.`);
      return { success: 'Transaction approved and funds deposited successfully!', newBalance };
    } else if (['997', '999'].includes(response.errCode)) {
      console.log(`UNKNOWN STATUS: Transaction ${transaction.referenceid} status unknown with code ${response.errCode}: ${response.errMsg}`);
      return { error: `Transaction status is unknown. Please check with the provider or retry later. (Code: ${response.errCode})` };
    }
    else {
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
  const validatedFields = AddMoneySchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
      const errorMessages = validatedFields.error.issues.map(issue => issue.message).join(', ');
      return { error: `Invalid data provided: ${errorMessages}` };
  }

  const { userId, username, amount, referenceid } = validatedFields.data;

  try {
      const user = await getUser(username);
      if (!user || !user.password) {
          return { error: `User ${username} not found or has no password.` };
      }
      const userPassword = user.password;
      const type = '0'; // 0 for deposit

      const signatureString = `${amount}${API_CONFIG.operatorcode}${userPassword}${API_CONFIG.providercode}${referenceid}${type}${username}${API_CONFIG.secret_key}`;
      const serverSignature = createHash('md5').update(signatureString).digest('hex').toUpperCase();

      const payload = {
          operatorcode: API_CONFIG.operatorcode,
          providercode: API_CONFIG.providercode,
          username,
          password: userPassword,
          referenceid,
          type,
          amount,
          signature: serverSignature,
      };

      const response = await makeTransferApiCall(payload);

      if (!response || !('errCode' in response)) {
        console.log(`API CALL FAILED: Invalid response from API for ${username}.`);
        return { error: 'Failed to communicate with the API provider. The response was invalid.' };
      }
      
      if (response.errCode === '0') {
          const newBalance = await addDepositToDb({
              orderId: referenceid,
              username,
              amount: amount,
              money: amount.toString(),
              status: 'SUCCESSFUL',
              createdAt: new Date(),
          });
          console.log(`SUCCESS: Manual deposit of ${amount} for ${username} successful.`);
          return { success: `Successfully deposited ₹${amount.toLocaleString()} to ${username}'s wallet.`, newBalance };
      } else if (['997', '999'].includes(response.errCode)) {
          console.log(`UNKNOWN STATUS: Manual deposit for ${username} status unknown with code ${response.errCode}: ${response.errMsg}`);
          return { error: `Transaction status is unknown. Please check with the provider or retry later. (Code: ${response.errCode})` };
      } else {
          console.log(`API ERROR: Manual deposit for ${username} failed with code ${response.errCode}: ${response.errMsg}`);
          return { error: `API Error: ${response.errMsg} (Code: ${response.errCode})` };
      }
  } catch (error) {
      console.error('Add Money Server Action Error:', error);
       if (error instanceof Error) {
        return { error: error.message };
    }
    return { error: 'An unexpected server error occurred.' };
  }
}
