import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define public routes (accessible without authentication)
const isPublicRoute = createRouteMatcher([
  '/',
  '/auth/(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/appointments/book(.*)',
  '/api/appointments/available-slots(.*)',
  '/api/appointments/cancel(.*)',
  '/api/forms/submit(.*)',
  '/api/chatbot/chat(.*)',
  '/api/embed/(.*)',
  '/api/widget/(.*)',
  '/embed/(.*)',
  '/api/stripe/webhook(.*)',
  '/api/webhooks/clerk(.*)',
  '/api/sync-user(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  // Protect all routes except public ones
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
