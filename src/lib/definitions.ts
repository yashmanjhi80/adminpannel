import type { ObjectId } from 'mongodb';

export type User = {
    _id: string; // Comes as ObjectId, but we'll stringify
    username: string;
    password?: string;
    walletBalance: number;
};

export type Deposit = {
    _id: string;
    orderId: string;
    username: string;
    amount: number;
    money: string;
    status: 'SUCCESSFUL' | 'FAILED' | 'PENDING';
    createdAt: Date;
};

export type PendingTransaction = {
    _id: string;
    username: string;
    referenceid: string;
    type: string;
    amount: number;
    status: 'PENDING';
    createdAt: Date;
};
