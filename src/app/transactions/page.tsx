'use client';
import TransactionsTable from '@/components/transactions-table';
import { fetchAllTransactions } from '@/lib/actions';
import { useEffect, useState } from 'react';
import type { Transaction } from '@/lib/definitions';
import withAuth from '@/components/with-auth';
import { Sidebar, SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import DashboardNav from '@/components/dashboard-nav';

function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTransactions() {
      setLoading(true);
      try {
        const apiTransactions = await fetchAllTransactions();
        setTransactions(apiTransactions);
      } catch (error) {
        console.error('Failed to fetch transactions', error);
      } finally {
        setLoading(false);
      }
    }
    loadTransactions();
  }, []);

  return (
    <SidebarProvider>
      <Sidebar>
        <DashboardNav />
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-col min-h-screen">
          <header className="sticky top-0 z-10 flex h-[57px] items-center gap-1 border-b bg-background px-4">
            <h1 className="text-xl font-semibold">Transactions</h1>
          </header>
          <div className="p-4 sm:p-6">
            {loading ? (
              <div>Loading transactions...</div>
            ) : (
              <TransactionsTable initialTransactions={transactions} />
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default withAuth(TransactionsPage);
