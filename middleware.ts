import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

/**
 * Middleware to protect dashboard routes
 * Redirects unauthenticated users to login page
 */
export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/auth/login',
    },
  }
);

/**
 * Protect all dashboard routes
 */
export const config = {
  matcher: ['/dashboard/:path*', '/api/dashboard/:path*'],
};
