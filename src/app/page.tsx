import { ArrowLeftRight, Users, ListChecks, Banknote } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import type { ChartConfig } from '@/components/ui/chart';
import { fetchDeposits, fetchPendingTransactions, fetchUsers } from '@/lib/data';

const chartData = [
  { month: 'January', successful: 186, pending: 80 },
  { month: 'February', successful: 305, pending: 200 },
  { month: 'March', successful: 237, pending: 120 },
  { month: 'April', successful: 73, pending: 190 },
  { month: 'May', successful: 209, pending: 130 },
  { month: 'June', successful: 214, pending: 140 },
];

const chartConfig = {
  successful: {
    label: 'Successful',
    color: 'hsl(var(--accent))',
  },
  pending: {
    label: 'Pending',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

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
            <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
              <BarChart accessibilityLayer data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                <YAxis />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar
                  dataKey="pending"
                  fill="var(--color-pending)"
                  radius={4}
                />
                <Bar
                  dataKey="successful"
                  fill="var(--color-successful)"
                  radius={4}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
