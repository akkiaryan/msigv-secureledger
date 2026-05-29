'use client';

import { useEffect } from 'react';
import { signOut } from 'next-auth/react';

export default function LogoutPage() {
  useEffect(() => {
    signOut({ callbackUrl: '/sign-in' });
  }, []);

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 text-gray-600 font-semibold p-4 text-center">
      <div>
        <p className="text-sm">Signing you out of MSIGV SecureLedger...</p>
        <div className="w-6 h-6 border-2 border-[#F37022] border-t-transparent rounded-full animate-spin mx-auto mt-4"></div>
      </div>
    </div>
  );
}
