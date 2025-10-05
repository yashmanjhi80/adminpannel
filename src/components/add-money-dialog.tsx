
'use client';

import { useEffect, useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { md5 } from 'js-md5';

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
import { config } from '@/lib/config';


function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Sending...' : 'Send API Request'}
    </Button>
  );
}

const SECRET_KEY = config.transfer.secret_key;

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
  const [state, formAction] = useActionState(addMoneyToWallet, null);
  
  const [formState, setFormState] = useState({
    apiUrl: config.transfer.apiUrl,
    operatorcode: config.transfer.operatorcode,
    providercode: config.transfer.providercode,
    username: '',
    password: '',
    referenceid: '',
    type: '0',
    amount: '',
    signature: '',
  });

  // Effect to initialize form when dialog opens
  useEffect(() => {
    if (isOpen && user) {
      setFormState({
        apiUrl: config.transfer.apiUrl,
        operatorcode: config.transfer.operatorcode,
        providercode: config.transfer.providercode,
        username: user.username,
        password: user.password || '',
        referenceid: `MANUAL${Date.now()}`, // Numeric, unique reference ID
        type: '0', // Deposit
        amount: '100', // Default amount
        signature: '',
      });
    }
  }, [isOpen, user]);

  // Effect to auto-generate signature when relevant fields change
  useEffect(() => {
    if (!isOpen) return; // Don't run when dialog is closed
    const { amount, operatorcode, password, providercode, referenceid, type, username } = formState;
    if (amount && operatorcode && password && providercode && referenceid && type && username) {
        const stringToSign = `${amount}${operatorcode}${password}${providercode}${referenceid}${type}${username}${SECRET_KEY}`;
        const newSignature = md5(stringToSign).toUpperCase();
        setFormState(prevState => ({
            ...prevState,
            signature: newSignature
        }));
    }
  }, [
      formState.amount, 
      formState.operatorcode, 
      formState.password, 
      formState.providercode, 
      formState.referenceid, 
      formState.type, 
      formState.username,
      isOpen
    ]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };
  
  // Effect to handle server action result
  useEffect(() => {
    if (!state || !isOpen) return;

    if (state.success) {
      toast({
        title: 'Success',
        description: state.success,
      });
      if(state.newBalance !== undefined) {
        onBalanceUpdate(user._id, state.newBalance);
      }
      setIsOpen(false);
    }
    if (state.error) {
      toast({
        title: 'Error',
        description: state.error,
        variant: 'destructive',
      });
    }
  }, [state, toast, setIsOpen, onBalanceUpdate, user._id, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Manual API Request</DialogTitle>
          <DialogDescription>
            Construct and send a manual `makeTransfer` request. All fields are editable. The signature is generated automatically.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="max-h-[70vh] overflow-y-auto pr-4">
          <div className="grid gap-4 py-4">
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="apiUrl" className="text-right">API URL</Label>
              <Input id="apiUrl" name="apiUrl" value={formState.apiUrl} onChange={handleInputChange} className="col-span-3 font-mono text-xs" />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="operatorcode" className="text-right">operatorcode</Label>
              <Input id="operatorcode" name="operatorcode" value={formState.operatorcode} onChange={handleInputChange} className="col-span-3" />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="providercode" className="text-right">providercode</Label>
              <Input id="providercode" name="providercode" value={formState.providercode} onChange={handleInputChange} className="col-span-3" />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="username" className="text-right">username</Label>
              <Input id="username" name="username" value={formState.username} onChange={handleInputChange} className="col-span-3" />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">password</Label>
              <Input id="password" name="password" value={formState.password} onChange={handleInputChange} className="col-span-3" />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="referenceid" className="text-right">referenceid</Label>
              <Input id="referenceid" name="referenceid" value={formState.referenceid} onChange={handleInputChange} className="col-span-3" />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">type</Label>
              <Input id="type" name="type" value={formState.type} onChange={handleInputChange} className="col-span-3" />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">amount (₹)</Label>
              <Input id="amount" name="amount" type="number" value={formState.amount} onChange={handleInputChange} className="col-span-3" />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="signature" className="text-right">signature</Label>
                <div className="col-span-3 flex items-center gap-2">
                    <Input id="signature" name="signature" value={formState.signature} onChange={handleInputChange} className="flex-grow font-mono text-xs" />
                </div>
            </div>
            
             {state?.error && (
                <p className="col-span-4 text-center text-sm text-destructive bg-destructive/10 p-2 rounded-md">{state.error}</p>
            )}
            
            {/* Hidden input to pass userId, which is not part of the API call itself but needed for DB update */}
            <input type="hidden" name="userId" value={user._id} />
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
