
import TransactionsTable from '@/components/transactions-table';
import { fetchAllTransactions } from '@/lib/data';
import type { Transaction } from '@/lib/definitions';

export default async function TransactionsPage() {
  const apiTransactions = await fetchAllTransactions();
  
  // Convert createdAt strings to Date objects on the server to prevent hydration mismatch.
  const transactionsWithDateObjects = apiTransactions.map(tx => ({
    ...tx,
    createdAt: new Date(tx.createdAt),
  }));

  return (
    <div className="flex flex-col min-h-screen">
       <header className="sticky top-0 z-10 flex h-[57px] items-center gap-1 border-b bg-background px-4">
        <h1 className="text-xl font-semibold">Transactions</h1>
      </header>
      <div className="p-4 sm:p-6">
        <TransactionsTable initialTransactions={transactionsWithDateObjects} />
      </div>
    </div>
  );
}
