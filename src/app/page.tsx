import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { fetchDeposits, fetchPendingTransactions, fetchUsers } from '@/lib/data';
import OverviewChart from '@/components/overview-chart';

export default async function DashboardPage() {
  const users = await fetchUsers();
  const deposits = await fetchDeposits();
  const pendingTransactions = await fetchPendingTransactions();

  const totalUsers = users.length;
  const totalTransactions = deposits.length + pendingTransactions.length;
  const totalPending = pendingTransactions.length;
  const totalDepositAmount = deposits.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-10 flex h-[57px] items-center gap-1 border-b bg-background px-4">
        <h1 className="text-xl font-semibold">Dashboard</h1>
      </header>
      <div className="flex flex-col gap-4 p-4 sm:gap-8 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Users</CardDescription>
              <CardTitle className="text-4xl">{totalUsers}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                All registered users
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Transactions</CardDescription>
              <CardTitle className="text-4xl">{totalTransactions}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                Includes all deposits and pending
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending Transactions</CardDescription>
              <CardTitle className="text-4xl">{totalPending}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                Transactions awaiting approval
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Deposit Amount</CardDescription>
              <CardTitle className="text-4xl">
                ₹{totalDepositAmount.toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                Sum of all successful deposits
              </div>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Transactions Overview</CardTitle>
            <CardDescription>
              A summary of successful vs. pending transactions over the last 6 months.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OverviewChart />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
