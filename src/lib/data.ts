import clientPromise from './mongodb';
import type { User, Deposit, PendingTransaction } from './definitions';
import { ObjectId } from 'mongodb';


const DB_NAME = process.env.DB_NAME || 'user';

async function getDb() {
    const client = await clientPromise;
    return client.db(DB_NAME);
}

// In a real application, these functions would fetch data from your MongoDB database.
export async function fetchUsers(): Promise<User[]> {
    const db = await getDb();
    const users = await db.collection('users').find({}).toArray();
    return JSON.parse(JSON.stringify(users));
}

export async function fetchDeposits(): Promise<Deposit[]> {
    const db = await getDb();
    const deposits = await db.collection('deposits').find({ status: 'SUCCESSFUL' }).toArray();
    return JSON.parse(JSON.stringify(deposits));
}

export async function fetchPendingTransactions(): Promise<PendingTransaction[]> {
    const db = await getDb();
    const pending = await db.collection('pendingTransactions').find({}).toArray();
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

export async function updateTransactionInDb(id: string, newStatus: 'SUCCESSFUL' | 'FAILED') {
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
        await db.collection('users').updateOne(
            { username: transaction.username },
            { $inc: { walletBalance: transaction.amount } }
        );

    } else { // FAILED
        // Move to a 'failedTransactions' collection or just delete from pending
        await pendingCollection.deleteOne({ _id: new ObjectId(id) });
        // Optionally, add to a failed collection for auditing
    }
}