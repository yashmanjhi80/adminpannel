
import clientPromise from './mongodb';
import type { User, Deposit } from './definitions';
import { ObjectId } from 'mongodb';
import { config } from './config';

export async function getDb() {
    const client = await clientPromise;
    return client.db(config.db.db_name);
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
