export type User = {
    _id: string; // Comes as ObjectId, but we'll stringify
    username: string;
    password?: string;
    walletBalance: number;
    referenceid: string;
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

// New type to match the external API structure
export type Transaction = {
    _id: string;
    orderId: string;
    username: string;
    password?: string | null;
    amount: number;
    walletProvider?: string;
    status: string;
    createdAt: string; // Comes as a string from the API
};
