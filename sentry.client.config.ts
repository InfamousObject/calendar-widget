import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Set environment based on NODE_ENV
  environment: process.env.NODE_ENV,

  // Replay may be useful for debugging, but can be removed if not needed
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Filter PII before sending events
  beforeSend(event) {
    // Remove cookies from request data
    if (event.request?.cookies) {
      delete event.request.cookies;
    }

    // Remove headers from request data
    if (event.request?.headers) {
      delete event.request.headers;
    }

    return event;
  },
});
