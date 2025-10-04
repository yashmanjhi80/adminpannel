'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { adminLogin } from '@/lib/actions';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Landmark } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Logging in...' : 'Login'}
    </Button>
  );
}

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [state, formAction] = useActionState(adminLogin, null);

  useEffect(() => {
    if (state?.success && state.user) {
      login(state.user);
      toast({
        title: 'Login Successful',
        description: `Welcome back, ${state.user.username}!`,
      });
      router.push('/');
    }
    if (state?.error) {
      toast({
        title: 'Login Failed',
        description: state.error,
        variant: 'destructive',
      });
    }
  }, [state, login, router, toast]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center mb-4">
             <Landmark className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">TransactionAce Admin</CardTitle>
          <CardDescription>
            Enter your credentials to access the admin dashboard.
          </CardDescription>
        </CardHeader>
        <form action={formAction}>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="username"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" placeholder="password" type="password" required />
            </div>
             {state?.error && (
                <p className="text-sm text-center text-destructive bg-destructive/10 p-2 rounded-md">{state.error}</p>
            )}
          </CardContent>
          <CardFooter>
            <SubmitButton />
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
