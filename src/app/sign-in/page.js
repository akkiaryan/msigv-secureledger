import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import SignInForm from '../components/SignInForm';

export const dynamic = 'force-dynamic';

export default async function SignInPage() {
  const session = await getServerSession(authOptions);

  if (session && session.user) {
    redirect('/');
  }

  return <SignInForm />;
}
