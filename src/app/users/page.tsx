'use client';
import UsersTable from '@/components/users-table';
import { fetchUsers } from '@/lib/actions';
import { useEffect, useState } from 'react';
import type { User } from '@/lib/definitions';
import withAuth from '@/components/with-auth';
import { Sidebar, SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import DashboardNav from '@/components/dashboard-nav';

function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUsers() {
      setLoading(true);
      try {
        const usersData = await fetchUsers();
        setUsers(usersData);
      } catch (error) {
        console.error('Failed to fetch users', error);
      } finally {
        setLoading(false);
      }
    }
    loadUsers();
  }, []);

  return (
    <SidebarProvider>
      <Sidebar>
        <DashboardNav />
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-col min-h-screen">
          <header className="sticky top-0 z-10 flex h-[57px] items-center gap-1 border-b bg-background px-4">
            <h1 className="text-xl font-semibold">Users</h1>
          </header>
          <div className="p-4 sm:p-6">
            {loading ? (
              <div>Loading users...</div>
            ) : (
              <UsersTable users={users} />
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default withAuth(UsersPage);
