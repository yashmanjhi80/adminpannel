'use server';

import { z } from 'zod';
import { createHash } from 'crypto';
import type { Transaction, AdminUser, User, Deposit, PendingTransaction } from './definitions';
import { addDepositToDb, getDb } from './data';
import { format } from 'date-fns';
import { config } from './config';

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

const AdminLoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const makeTransferApiCall = async (
  apiUrl: string,
  payload: Record<string, string | number>
) => {
  const params = new URLSearchParams();
  for (const key in payload) {
    params.append(key, String(payload[key]));
  }

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
      if (responseText.toLowerCase().includes('ok')) {
        return { errCode: '0', errMsg: 'OK' }; 
      }
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
  const payload: Record<string, any> = {
    order_sn: transaction.orderId,
    money: transaction.amount.toFixed(2),
    status: '1',
    pay_time: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
    remark: 'ManualApproval',
  };

  const stringToSign = `money=${payload.money}&notify_url=${config.lgPay.notifyUrl}&order_sn=${payload.order_sn}&remark=${payload.remark}&status=${payload.status}&key=${config.lgPay.secret}`;
  
  payload.sign = createHash('md5').update(stringToSign).digest('hex').toUpperCase();

  console.log(`[CALLBACK_CALL] Sending approval for order: ${payload.order_sn}`);
  console.log(`[CALLBACK_CALL] String to sign: ${stringToSign}`);
  console.log(`[CALLBACK_CALL] Payload:`, payload);

  try {
    const response = await fetch(config.api.paymentCallback, {
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

export async function adminLogin(prevState: any, formData: FormData) {
  const validatedFields = AdminLoginSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    const errorMessages = validatedFields.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('; ');
    return { error: `Invalid data: ${errorMessages}` };
  }

  const { username, password } = validatedFields.data;

  try {
    const response = await fetch(config.api.adminLogin, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return { error: data.message || 'Login failed. Please check your credentials.' };
    }

    return { success: true, user: data.user as AdminUser };

  } catch (error) {
    console.error('[ADMIN_LOGIN_ERROR]', error);
    if (error instanceof Error) {
      return { error: `Network error: ${error.message}` };
    }
    return { error: 'An unknown network error occurred during login.' };
  }
}


export async function fetchUsers(): Promise<User[]> {
    const db = await getDb();
    const users = await db.collection('users').find({}).sort({ createdAt: -1 }).toArray();
    return JSON.parse(JSON.stringify(users));
}

async function fetchDeposits(): Promise<Deposit[]> {
    const db = await getDb();
    const deposits = await db.collection('deposits').find({ status: 'SUCCESSFUL' }).sort({ createdAt: -1 }).toArray();
    return JSON.parse(JSON.stringify(deposits));
}

async function fetchPendingTransactions(): Promise<PendingTransaction[]> {
    const db = await getDb();
    const pending = await db.collection('pendingTransactions').find({}).sort({ createdAt: -1 }).toArray();
    return JSON.parse(JSON.stringify(pending));
}

export async function fetchDashboardData() {
    const [usersData, depositsData, pendingData] = await Promise.all([
        fetchUsers(),
        fetchDeposits(),
        fetchPendingTransactions(),
    ]);
    return { usersData, depositsData, pendingData };
}

export async function fetchAllTransactions(): Promise<Transaction[]> {
    try {
        const response = await fetch(config.api.recentTransactions, {
            cache: 'no-store' // Ensure we get fresh data
        });
        if (!response.ok) {
            console.error("Failed to fetch transactions from API:", response.statusText);
            return [];
        }
        const data = await response.json();
        if (data.success && Array.isArray(data.transactions)) {
            return data.transactions;
        }
        return [];
    } catch (error) {
        console.error("Error fetching external transactions:", error);
        return [];
    }
}
