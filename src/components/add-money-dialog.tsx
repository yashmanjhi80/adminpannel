'use client';

import { useEffect, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { addMoneyToWallet } from '@/lib/actions';
import type { User } from '@/lib/definitions';

const AddMoneySchema = z.object({
  amount: z.coerce.number().positive({ message: 'Amount must be greater than zero.' }),
});

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Depositing...' : 'Deposit'}
    </Button>
  );
}

export default function AddMoneyDialog({
  isOpen,
  setIsOpen,
  user,
  onBalanceUpdate,
}: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  user: User;
  onBalanceUpdate: (userId: string, newBalance: number) => void;
}) {
  const { toast } = useToast();
  const [state, dispatch] = useActionState(addMoneyToWallet, undefined);

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(AddMoneySchema),
    defaultValues: { amount: '' }
  });

  useEffect(() => {
    if (state?.success) {
      toast({
        title: 'Success',
        description: state.success,
      });
      if(state.newBalance !== undefined) {
        onBalanceUpdate(user._id, state.newBalance);
      }
      setIsOpen(false);
      reset();
    }
    if (state?.error) {
      toast({
        title: 'Error',
        description: state.error,
        variant: 'destructive',
      });
    }
  }, [state, toast, setIsOpen, reset, user._id, onBalanceUpdate]);

  const onFormSubmit = (data: z.infer<typeof AddMoneySchema>) => {
    const formData = new FormData();
    formData.append('userId', user._id);
    formData.append('username', user.username);
    formData.append('amount', data.amount.toString());
    dispatch(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Money to Wallet</DialogTitle>
          <DialogDescription>
            Manually deposit funds into {user.username}'s wallet. This will use the live API.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onFormSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="username" className="text-right">
                Username
              </Label>
              <Input id="username" value={user.username} readOnly className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount (₹)
              </Label>
              <Input id="amount" type="number" {...register('amount')} className="col-span-3" />
            </div>
             {errors.amount && (
                <p className="col-span-4 text-right text-sm text-destructive">{errors.amount.message}</p>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">Cancel</Button>
            </DialogClose>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
