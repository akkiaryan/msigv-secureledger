import { getServerSession } from 'next-auth/next';
import { authOptions } from './api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import DashboardClient from './components/DashboardClient';
import { getDashboardData } from './actions';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect('/sign-in');
  }

  // Fetch initial ledger and operation data via shared helper
  const res = await getDashboardData();
  
  if (!res.success) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 text-red-500 font-bold p-4 text-center">
        <div>
          <h1 className="text-lg">Database Connection / Ledger Error</h1>
          <p className="text-xs font-normal text-gray-500 mt-1">{res.error || "Failed to load dashboard data"}</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardClient 
      initialData={res.data} 
      user={session.user} 
    />
  );
}
