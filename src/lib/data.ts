
import clientPromise from './mongodb';
import type { User, Deposit, PendingTransaction } from './definitions';
import { ObjectId } from 'mongodb';

const DB_NAME = process.env.DB_NAME || 'user';

async function getDb() {
    const client = await clientPromise;
    return client.db(DB_NAME);
}

export async function fetchUsers(): Promise<User[]> {
    const db = await getDb();
    const users = await db.collection('users').find({}).sort({ createdAt: -1 }).toArray();
    return JSON.parse(JSON.stringify(users));
}

export async function fetchDeposits(): Promise<Deposit[]> {
    const db = await getDb();
    const deposits = await db.collection('deposits').find({ status: 'SUCCESSFUL' }).sort({ createdAt: -1 }).toArray();
    return JSON.parse(JSON.stringify(deposits));
}

export async function fetchPendingTransactions(): Promise<PendingTransaction[]> {
    const db = await getDb();
    const pending = await db.collection('pendingTransactions').find({}).sort({ createdAt: -1 }).toArray();
    return JSON.parse(JSON.stringify(pending));
}

export async function fetchAllTransactions(): Promise<(Deposit | PendingTransaction)[]> {
    const allDeposits = await fetchDeposits();
    const allPending = await fetchPendingTransactions();
    const combined = [...allDeposits, ...allPending];
    // sort by date descending
    return combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getUser(username: string): Promise<User | null> {
    const db = await getDb();
    const user = await db.collection('users').findOne({ username: username });
    if (!user) return null;
    return JSON.parse(JSON.stringify(user));
}

export async function updateTransactionInDb(id: string, newStatus: 'SUCCESSFUL' | 'FAILED', referenceid: string | null) {
    const db = await getDb();
    const pendingCollection = db.collection('pendingTransactions');
    
    const transaction = await pendingCollection.findOne({ _id: new ObjectId(id) });

    if (!transaction) {
        throw new Error('Pending transaction not found');
    }

    if (newStatus === 'SUCCESSFUL') {
        const deposit: Omit<Deposit, '_id'> = {
            orderId: transaction.referenceid,
            username: transaction.username,
            amount: transaction.amount,
            money: transaction.amount.toString(),
            status: 'SUCCESSFUL',
            createdAt: transaction.createdAt,
        };
        
        await db.collection('deposits').insertOne(deposit);
        await pendingCollection.deleteOne({ _id: new ObjectId(id) });

        // Update user's wallet
        const updatedUser = await db.collection('users').findOneAndUpdate(
            { username: transaction.username },
            { $inc: { walletBalance: transaction.amount } },
            { returnDocument: 'after', projection: { walletBalance: 1 }, upsert: true }
        );
        
        if (!updatedUser) {
            // After upsert, this should theoretically not be hit if the user exists.
            // If it's a new user somehow, their balance is now set.
            // If we still get no user, something is very wrong.
            const userCheck = await db.collection('users').findOne({ username: transaction.username });
            if (!userCheck) {
                 throw new Error('User not found or failed to update balance');
            }
            return { newBalance: userCheck.walletBalance };
        }

        return { newBalance: updatedUser.walletBalance };

    } else { // FAILED
        // Move to a 'failedTransactions' collection or just delete from pending
        await pendingCollection.deleteOne({ _id: new ObjectId(id) });
        // Optionally, add to a failed collection for auditing
        return { newBalance: null };
    }
}


export async function addDepositToDb(depositData: Omit<Deposit, '_id'>): Promise<number> {
    const db = await getDb();
    
    // Insert the successful deposit record
    await db.collection('deposits').insertOne(depositData);
    
    // Update the user's wallet balance
    const result = await db.collection('users').findOneAndUpdate(
        { username: depositData.username },
        { $inc: { walletBalance: depositData.amount } },
        { returnDocument: 'after', projection: { walletBalance: 1 }, upsert: true }
    );

    if (!result) {
        const userCheck = await db.collection('users').findOne({ username: depositData.username });
         if (!userCheck) {
            throw new Error('User not found or failed to update balance after upsert.');
        }
        return userCheck.walletBalance;
    }

    return result.walletBalance;
}
