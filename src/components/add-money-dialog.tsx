
'use client';

import { useEffect, useActionState, useState } from 'react';
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

const API_CONFIG = {
  providercode: 'JE',
  operatorcode: 'i4bi',
};


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
  const [state, formAction] = useActionState(addMoneyToWallet, undefined);
  const [referenceId, setReferenceId] = useState('');

  const { register, formState: { errors }, reset } = useForm({
    resolver: zodResolver(AddMoneySchema),
    defaultValues: { amount: '' }
  });

  useEffect(() => {
    if (isOpen) {
      const newReferenceId = `MANUAL_${Date.now()}`;
      setReferenceId(newReferenceId);
    }
  }, [isOpen]);
  
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Money to Wallet</DialogTitle>
          <DialogDescription>
            Manually deposit funds into {user.username}'s wallet. This will use the live API.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction}>
          <div className="grid gap-4 py-4">
            <input type="hidden" name="userId" value={user._id} />
            <input type="hidden" name="username" value={user.username} />
            <input type="hidden" name="referenceid" value={referenceId} />
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount (₹)
              </Label>
              <Input id="amount" type="number" {...register('amount')} name="amount" className="col-span-3" />
            </div>
             {errors.amount && (
                <p className="col-span-4 text-right text-sm text-destructive">{errors.amount.message}</p>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right col-span-1">Username</Label>
              <Input value={user.username} readOnly className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right col-span-1">Op. Code</Label>
              <Input value={API_CONFIG.operatorcode} readOnly className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right col-span-1">Prov. Code</Label>
              <Input value={API_CONFIG.providercode} readOnly className="col-span-3" />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right col-span-1">Ref. ID</Label>
              <Input value={referenceId} readOnly className="col-span-3" />
            </div>
            
             {state?.error && (
                <p className="col-span-4 text-right text-sm text-destructive">{state.error}</p>
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
