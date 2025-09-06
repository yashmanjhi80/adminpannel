'use client';
import type { User } from '@/lib/definitions';
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
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

export default function UsersTable({ users }: { users: User[] }) {
  const { toast } = useToast();
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  const handlePasswordReset = (username: string) => {
    // In a real app, this would trigger a password reset flow (e.g., send an email)
    // or open a dialog to set a new password.
    toast({
      title: 'Password Reset',
      description: `A password reset has been initiated for ${username}.`,
    });
  };

  const togglePasswordVisibility = (userId: string) => {
    setShowPasswords(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <CardDescription>
          View and manage all registered users.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Reference ID</TableHead>
                <TableHead>Wallet Balance</TableHead>
                <TableHead>Password</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user._id}>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>{user.referenceid}</TableCell>
                  <TableCell>
                    ₹{(user.walletBalance || 0).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-mono">
                    <div className="flex items-center gap-2">
                      <span>
                        {showPasswords[user._id] ? user.password : '**********'}
                      </span>
                      <Button variant="ghost" size="sm" onClick={() => togglePasswordVisibility(user._id)}>
                        {showPasswords[user._id] ? 'Hide' : 'Show'}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePasswordReset(user.username)}
                    >
                      Reset Password
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
