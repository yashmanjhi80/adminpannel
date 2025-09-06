'use client';

import { useState, useTransition, useMemo } from 'react';
import type { Deposit, PendingTransaction } from '@/lib/definitions';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MoreHorizontal, BotMessageSquare, AlertCircle } from 'lucide-react';
import { updateTransactionStatus } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';

type Transaction = Deposit | PendingTransaction;

type DialogState = {
  isOpen: boolean;
  transaction: PendingTransaction | null;
  action: 'SUCCESSFUL' | 'FAILED' | null;
};

type AlertState = {
  isOpen: boolean;
  title: string;
  description: React.ReactNode;
  isAiAssistance: boolean;
};

export default function TransactionsTable({
  initialTransactions,
}: {
  initialTransactions: Transaction[];
}) {
  const [transactions, setTransactions] =
    useState<Transaction[]>(initialTransactions);
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
    isAiAssistance: false,
  });

  const filteredTransactions = useMemo(() => {
    if (filter === 'all') return transactions;
    return transactions.filter((t) => t.status.toLowerCase() === filter);
  }, [transactions, filter]);

  const openConfirmationDialog = (
    transaction: PendingTransaction,
    action: 'SUCCESSFUL' | 'FAILED'
  ) => {
    setDialogState({ isOpen: true, transaction, action });
  };

  const handleConfirmAction = () => {
    if (!dialogState.transaction || !dialogState.action) return;

    startTransition(async () => {
      const result = await updateTransactionStatus(
        dialogState.transaction!,
        dialogState.action!
      );
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
              ? { ...t, status: dialogState.action! }
              : t
          )
        );
      } else if (result.aiAssistance) {
        setAlertState({
          isOpen: true,
          title: 'AI Troubleshooting Assistance',
          description: result.aiAssistance,
          isAiAssistance: true,
        });
      } else if (result.error) {
        setAlertState({
          isOpen: true,
          title: 'Error',
          description: result.error,
          isAiAssistance: false,
        });
      }
    });
  };
  
  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
        case 'SUCCESSFUL':
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
              View and manage all user transactions.
            </CardDescription>
          </div>
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="successful">Successful</TabsTrigger>
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
                  <TableHead>Reference/Order ID</TableHead>
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
                    <TableCell>{'referenceid' in tx ? tx.referenceid : tx.orderId}</TableCell>
                    <TableCell>₹{tx.amount.toLocaleString()}</TableCell>
                    <TableCell>{tx.createdAt.toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(tx.status)}>{tx.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {tx.status === 'PENDING' && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                openConfirmationDialog(tx as PendingTransaction, 'SUCCESSFUL')
                              }
                            >
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                openConfirmationDialog(tx as PendingTransaction, 'FAILED')
                              }
                              className="text-red-600"
                            >
                              Reject
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
              with amount{' '}
              <span className="font-bold">
                ₹{dialogState.transaction?.amount.toLocaleString()}
              </span>{' '}
              as{' '}
              <span className="font-bold">{dialogState.action}</span>. This may
              initiate a fund transfer.
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
        onOpenChange={(open) => !open && setAlertState({ isOpen: false, title: '', description: '', isAiAssistance: false })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
                {alertState.isAiAssistance ? <BotMessageSquare className="text-primary"/> : <AlertCircle className="text-destructive" />}
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
