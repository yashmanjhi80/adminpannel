
'use client';

import { useState, useTransition, useMemo, type ReactNode, useEffect } from 'react';
import { format } from 'date-fns';
import type { Transaction } from '@/lib/definitions';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MoreHorizontal, AlertCircle } from 'lucide-react';
import { approveTransaction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';

type DialogState = {
  isOpen: boolean;
  transaction: Transaction | null;
  action: 'APPROVE' | 'REJECT' | null;
};

type AlertState = {
  isOpen: boolean;
  title: string;
  description: ReactNode;
};

export default function TransactionsTable({
  initialTransactions,
}: {
  initialTransactions: Transaction[];
}) {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const [filter, setFilter] = useState('all');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const [dialogState, setDialogState] = useState<DialogState>({
    isOpen: false,
    transaction: null,
    action: null,
  });

  const [alertState, setAlertState] = useState<AlertState>({
    isOpen: false,
    title: '',
    description: '',
  });

  const filteredTransactions = useMemo(() => {
    if (filter === 'all') return transactions;
    return transactions.filter((t) => t.status.toLowerCase() === filter);
  }, [transactions, filter]);

  const openConfirmationDialog = (
    transaction: Transaction,
    action: 'APPROVE' | 'REJECT'
  ) => {
    setDialogState({ isOpen: true, transaction, action });
  };

  const handleConfirmAction = () => {
    if (!dialogState.transaction || !dialogState.action) return;

    if (dialogState.action === 'APPROVE') {
      startTransition(async () => {
        const result = await approveTransaction(dialogState.transaction!);
        setDialogState({ isOpen: false, transaction: null, action: null });

        if (result.success) {
          toast({
            title: 'Success',
            description: result.success,
          });
          // Optimistically update UI
          setTransactions((prev) =>
            prev.map((t) =>
              t._id === dialogState.transaction?._id
                ? { ...t, status: 'SUCCESSFUL' } // Or 'PAID' depending on what the callback does
                : t
            )
          );
        } else if (result.error) {
          setAlertState({
            isOpen: true,
            title: 'Approval Error',
            description: result.error,
          });
        }
      });
    }
  };

  const getStatusVariant = (
    status: string
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status.toUpperCase()) {
      case 'SUCCESSFUL':
      case 'PAID':
        return 'default';
      case 'PENDING':
        return 'secondary';
      case 'FAILED':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex-col items-start gap-4 md:flex-row md:items-center">
          <div className="flex-1">
            <CardTitle>All Transactions</CardTitle>
            <CardDescription>
              Viewing recent transactions from the provider.
            </CardDescription>
          </div>
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="paid">Successful</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="failed">Failed</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((tx) => (
                  <TableRow key={tx._id}>
                    <TableCell className="font-medium">{tx.username}</TableCell>
                    <TableCell>{tx.orderId}</TableCell>
                    <TableCell>₹{tx.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      {isClient
                        ? format(new Date(tx.createdAt), 'MM/dd/yyyy HH:mm')
                        : 'Loading...'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(tx.status)}>
                        {tx.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {tx.status.toLowerCase() === 'pending' && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => openConfirmationDialog(tx, 'APPROVE')}
                            >
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled
                              className="text-red-600"
                            >
                              Reject (Action N/A)
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog
        open={dialogState.isOpen}
        onOpenChange={(open) =>
          !open && setDialogState({ isOpen: false, transaction: null, action: null })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will mark the transaction for{' '}
              <span className="font-bold">
                {dialogState.transaction?.username}
              </span>{' '}
              with order ID{' '}
              <span className="font-bold">
                {dialogState.transaction?.orderId}
              </span>{' '}
              as{' '}
              <span className="font-bold">{dialogState.action}D</span>. This will
              trigger a payment callback to the server.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAction} disabled={isPending}>
              {isPending ? 'Processing...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={alertState.isOpen}
        onOpenChange={(open) =>
          !open && setAlertState({ isOpen: false, title: '', description: '' })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="text-destructive" />
              {alertState.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="pt-4 whitespace-pre-wrap">
              {alertState.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
