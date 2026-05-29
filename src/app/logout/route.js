import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const cookieStore = await cookies();
  
  // Retrieve and delete all next-auth related cookies
  const allCookies = cookieStore.getAll();
  for (const cookie of allCookies) {
    if (cookie.name.includes('next-auth')) {
      cookieStore.delete(cookie.name);
    }
  }

  // Redirect the user back to the sign-in screen
  return NextResponse.redirect(new URL('/sign-in', request.url));
}
