import TransactionsTable from '@/components/transactions-table';
import { fetchAllTransactions } from '@/lib/data';
import type { Transaction } from '@/lib/definitions';

export default async function TransactionsPage() {
  const apiTransactions: Transaction[] = await fetchAllTransactions();
  
  // The data from the API already has createdAt as a string, so no conversion is needed.
  // We just pass it directly.

  return (
    <div className="flex flex-col min-h-screen">
       <header className="sticky top-0 z-10 flex h-[57px] items-center gap-1 border-b bg-background px-4">
        <h1 className="text-xl font-semibold">Transactions</h1>
      </header>
      <div className="p-4 sm:p-6">
        <TransactionsTable initialTransactions={apiTransactions} />
      </div>
    </div>
  );
}
