import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Set tracesSampleRate to 0.1 (10%) for server-side to reduce overhead
  // Adjust this value in production based on your traffic
  tracesSampleRate: 0.1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Set environment based on NODE_ENV
  environment: process.env.NODE_ENV,
});
