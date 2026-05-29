import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import SignInForm from '../components/SignInForm';

export const dynamic = 'force-dynamic';

export default async function SignInPage() {
  try {
    const session = await getServerSession(authOptions);

    if (session && session.user) {
      redirect('/');
    }

    return <SignInForm />;
  } catch (error) {
    console.error("CRITICAL: Error loading sign-in page:", error);
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 text-red-500 font-bold p-4 text-center">
        <div>
          <h1 className="text-lg">Authentication System Error</h1>
          <p className="text-xs font-normal text-gray-500 mt-1">
            Please try refreshing the page. If the issue persists, contact the system administrator.
          </p>
        </div>
      </div>
    );
  }
}
