import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { DashboardNav } from '@/ui/dashboard/dashboard-nav';
import { DashboardHeader } from '@/ui/dashboard/dashboard-header';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader session={session} />
      <div className="flex">
        <DashboardNav />
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

