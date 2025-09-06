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
import AddMoneyDialog from './add-money-dialog';

export default function UsersTable({ users: initialUsers }: { users: User[] }) {
  const { toast } = useToast();
  const [users, setUsers] = useState(initialUsers);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const handlePasswordReset = (username: string) => {
    toast({
      title: 'Password Reset',
      description: `A password reset has been initiated for ${username}.`,
    });
  };

  const togglePasswordVisibility = (userId: string) => {
    setShowPasswords(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  const handleOpenDialog = (user: User) => {
    setSelectedUser(user);
    setDialogOpen(true);
  }

  const handleBalanceUpdate = (userId: string, newBalance: number) => {
    setUsers(currentUsers => 
      currentUsers.map(u => u._id === userId ? { ...u, walletBalance: newBalance } : u)
    );
  };


  return (
    <>
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
                    <TableCell className="text-right space-x-2">
                       <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleOpenDialog(user)}
                      >
                        Add Money
                      </Button>
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
      {selectedUser && (
        <AddMoneyDialog 
          isOpen={isDialogOpen} 
          setIsOpen={setDialogOpen} 
          user={selectedUser} 
          onBalanceUpdate={handleBalanceUpdate}
        />
      )}
    </>
  );
}
