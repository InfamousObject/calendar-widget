import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define public routes (accessible without authentication)
const isPublicRoute = createRouteMatcher([
  '/',
  '/privacy',
  '/terms',
  '/pricing',
  '/alternatives',
  '/alternatives/(.*)',
  '/auth/(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/invite/(.*)',
  '/api/appointments/book(.*)',
  '/api/appointments/cancel(.*)',
  '/book/(.*)',
  '/api/csrf/token(.*)',
  '/docs/(.*)',
  '/api/availability/slots(.*)',
  '/api/availability/dates(.*)',
  '/api/forms/submit(.*)',
  '/api/chatbot/chat(.*)',
  '/api/embed/(.*)',
  '/api/widget/(.*)',
  '/embed/(.*)',
  '/api/stripe/webhook(.*)',
  '/api/webhooks/clerk(.*)',
  '/api/sync-user(.*)',
  '/api/team/accept(.*)',
  '/api/wordpress/(.*)',
  '/api/cron/(.*)',
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
