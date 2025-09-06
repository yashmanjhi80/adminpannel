import UsersTable from '@/components/users-table';
import { fetchUsers } from '@/lib/data';

export default async function UsersPage() {
  const users = await fetchUsers();

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-10 flex h-[57px] items-center gap-1 border-b bg-background px-4">
        <h1 className="text-xl font-semibold">Users</h1>
      </header>
      <div className="p-4 sm:p-6">
        <UsersTable users={users} />
      </div>
    </div>
  );
}
