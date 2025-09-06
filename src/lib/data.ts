import type { User, Deposit, PendingTransaction } from './definitions';

const users: User[] = [
  { "_id": "68a2feba378cc4849ef13214", "username": "yash7879", "password": "password123", "walletBalance": 5000 },
  { "_id": "689efba65eaa619491ea1d80", "username": "harsh63", "password": "password456", "walletBalance": 12000 },
  { "_id": "68a4009383b71c1552e9554d", "username": "aman_sharma", "password": "password789", "walletBalance": 7500 },
  { "_id": "68a4009383b71c1552e9554e", "username": "priya_p", "password": "password101", "walletBalance": 25000 },
  { "_id": "68a4009383b71c1552e9554f", "username": "rohit_k", "password": "password112", "walletBalance": 1800 },
];

const deposits: Deposit[] = [
  { "_id": "689efba65eaa619491ea1d80", "orderId": "ORD1755249573834593", "username": "harsh63", "amount": 100, "money": "10000", "status": "SUCCESSFUL", "createdAt": new Date("2024-07-15T12:39:34.638Z") },
  { "_id": "689efba65eaa619491ea1d81", "orderId": "ORD1755249573834594", "username": "yash7879", "amount": 250, "money": "25000", "status": "SUCCESSFUL", "createdAt": new Date("2024-07-16T09:15:22.112Z") },
  { "_id": "689efba65eaa619491ea1d82", "orderId": "ORD1755249573834595", "username": "priya_p", "amount": 500, "money": "50000", "status": "SUCCESSFUL", "createdAt": new Date("2024-07-16T14:45:00.000Z") },
];

const pendingTransactions: PendingTransaction[] = [
  { "_id": "68a2feba378cc4849ef13214", "username": "yash7879", "referenceid": "ORD1755505989268872", "type": "0", "amount": 100, "status": "PENDING", "createdAt": new Date("2024-07-18T18:08:26.190Z") },
  { "_id": "68a4009383b71c1552e9554d", "username": "aman_sharma", "referenceid": "ORD1755578247077177", "type": "0", "amount": 75, "status": "PENDING", "createdAt": new Date("2024-07-19T09:21:55.470Z") },
  { "_id": "68a4009383b71c1552e9555e", "username": "rohit_k", "referenceid": "ORD1755578247077178", "type": "0", "amount": 101, "status": "PENDING", "createdAt": new Date("2024-07-19T11:30:10.000Z") },
  { "_id": "68a4009383b71c1552e9555f", "username": "priya_p", "referenceid": "ORD1755578247077179", "type": "0", "amount": 1200, "status": "PENDING", "createdAt": new Date("2024-07-20T08:00:05.123Z") },
];

// In a real application, these functions would fetch data from your MongoDB database.
export async function fetchUsers(): Promise<User[]> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  return users;
}

export async function fetchDeposits(): Promise<Deposit[]> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return deposits;
}

export async function fetchPendingTransactions(): Promise<PendingTransaction[]> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return pendingTransactions;
}

export async function fetchAllTransactions(): Promise<(Deposit | PendingTransaction)[]> {
    const allDeposits = await fetchDeposits();
    const allPending = await fetchPendingTransactions();
    const combined = [...allDeposits, ...allPending];
    // sort by date descending
    return combined.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
