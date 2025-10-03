
import TransactionsTable from '@/components/transactions-table';
import { fetchAllTransactions } from '@/lib/data';

export default async function TransactionsPage() {
  const apiTransactions = await fetchAllTransactions();

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
