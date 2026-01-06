# Sentry Error Tracking Setup Guide

This guide will help you configure Sentry for production error monitoring in your Calendar Widget application.

## Overview

Sentry has been configured with the following features:
- **Client-side error tracking** with 100% transaction sampling
- **Server-side error tracking** with 10% transaction sampling (optimized for production)
- **PII filtering** to protect user privacy (cookies and headers are removed)
- **Session replay** for debugging user interactions
- **Error boundary integration** to catch React errors
- **Source map uploads** for better stack traces (when auth token is configured)

## Setup Instructions

### 1. Create a Sentry Account

1. Go to [https://sentry.io](https://sentry.io)
2. Sign up for a free account or log in
3. Create a new organization (if you don't have one)

### 2. Create a Sentry Project

1. In your Sentry dashboard, click **"Create Project"**
2. Select **"Next.js"** as the platform
3. Name your project: `calendar-widget` (or your preferred name)
4. Click **"Create Project"**

### 3. Get Your DSN (Data Source Name)

After creating the project, you'll see your DSN. It looks like:
```
https://abc123def456@o123456.ingest.sentry.io/7890123
```

Copy this DSN - you'll need it for the next step.

### 4. Configure Environment Variables

Update your `.env` file with the Sentry DSN:

```bash
NEXT_PUBLIC_SENTRY_DSN="https://your-actual-dsn-here@sentry.io/project-id"
```

### 5. Get Auth Token (Required for Source Maps)

Source maps allow Sentry to show you the original code in stack traces instead of minified code.

1. Go to **Settings > Auth Tokens** in your Sentry organization
2. Click **"Create New Token"**
3. Give it a name: `calendar-widget-source-maps`
4. Select the following scopes:
   - `project:read`
   - `project:releases`
   - `org:read`
5. Click **"Create Token"**
6. Copy the token and add it to your `.env`:

```bash
SENTRY_AUTH_TOKEN="your-auth-token-here"
```

**Important:** Never commit the auth token to git. It's already in `.gitignore`.

### 6. Update Sentry Configuration

Update `next.config.ts` with your actual Sentry organization name:

```typescript
org: "your-sentry-org-name", // Replace with your actual org name
```

You can also update `.sentryclirc`:

```
[auth]
token=your-auth-token-here

[defaults]
url=https://sentry.io/
org=your-actual-org-name
project=calendar-widget
```

## Testing Error Reporting

### Test Client-Side Errors

Create a test page or add a button to trigger an error:

```typescript
// In any client component
'use client';

export default function TestSentry() {
  const throwError = () => {
    throw new Error('Test Sentry Error - Client Side');
  };

  return (
    <button onClick={throwError}>
      Throw Test Error
    </button>
  );
}
```

### Test Server-Side Errors

Create an API route to test server errors:

```typescript
// app/api/test-sentry/route.ts
export async function GET() {
  throw new Error('Test Sentry Error - Server Side');
}
```

### Test Error Boundary

To test the error boundary integration:

1. Trigger a React error in a component
2. Check that the error boundary UI appears
3. Verify the error appears in your Sentry dashboard

### Verify in Sentry Dashboard

1. Go to your Sentry project dashboard
2. Navigate to **Issues** in the sidebar
3. You should see your test errors appear within a few seconds
4. Click on an error to see:
   - Stack trace
   - User context
   - Environment information
   - Session replay (if enabled)

## Configuration Details

### Client Configuration (`sentry.client.config.ts`)

- **Traces Sample Rate:** 100% - Captures all client-side transactions
- **Replays on Error:** 100% - Records session replay when errors occur
- **Replays Session:** 10% - Records 10% of all sessions
- **PII Filtering:** Removes cookies and headers before sending to Sentry

### Server Configuration (`sentry.server.config.ts`)

- **Traces Sample Rate:** 10% - Captures 10% of server transactions (reduces overhead)
- Optimized for production performance

### Edge Configuration (`sentry.edge.config.ts`)

- **Traces Sample Rate:** 10% - Captures 10% of edge runtime transactions
- Used for middleware and edge API routes

## Production Deployment

### Environment Variables for Production

Make sure to set these environment variables in your production environment (Vercel, Railway, etc.):

```bash
NEXT_PUBLIC_SENTRY_DSN="your-production-dsn"
SENTRY_AUTH_TOKEN="your-auth-token"
```

### Build Process

When you build for production:

```bash
npm run build
```

The build process will:
1. Create production bundles
2. Upload source maps to Sentry (if auth token is configured)
3. Hide source maps from the client (for security)

## Monitoring and Alerts

### Set Up Alerts

1. Go to **Settings > Alerts** in Sentry
2. Create alert rules for:
   - New issues
   - High-frequency errors
   - Performance degradation
3. Configure notifications (email, Slack, etc.)

### Performance Monitoring

Sentry automatically tracks:
- Page load times
- API response times
- Database query performance
- Third-party service calls

View these metrics in the **Performance** tab.

## Privacy and Security

The configuration includes PII filtering:
- Cookies are removed from error reports
- Headers are removed from error reports
- User IP addresses are anonymized (configure in Sentry settings if needed)

### GDPR Compliance

For GDPR compliance:
1. Add a privacy notice about error tracking
2. Configure data retention in Sentry settings
3. Consider implementing user consent for session replay

## Troubleshooting

### Errors Not Appearing in Sentry

1. **Check DSN:** Verify `NEXT_PUBLIC_SENTRY_DSN` is set correctly
2. **Check Console:** Look for Sentry initialization errors in browser console
3. **Check Network:** Verify requests to `sentry.io` are not blocked
4. **Verify Environment:** Ensure `NODE_ENV` is set correctly

### Source Maps Not Working

1. **Check Auth Token:** Verify `SENTRY_AUTH_TOKEN` is set
2. **Check Build Output:** Look for source map upload logs during build
3. **Check Sentry Settings:** Verify organization and project names match

### Performance Issues

If Sentry is impacting performance:
1. Reduce `tracesSampleRate` in server config (default: 0.1)
2. Reduce `replaysSessionSampleRate` in client config (default: 0.1)
3. Disable session replay if not needed

## Additional Resources

- [Sentry Next.js Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry Best Practices](https://docs.sentry.io/product/best-practices/)
- [Performance Monitoring](https://docs.sentry.io/product/performance/)
- [Session Replay](https://docs.sentry.io/product/session-replay/)

## Cost Considerations

Sentry pricing is based on:
- Number of errors
- Number of transactions
- Number of replays
- Data retention period

**Free Tier includes:**
- 5,000 errors/month
- 10,000 transactions/month
- 50 replays/month

Monitor your usage in **Settings > Usage & Billing**.

## Next Steps

1. Set up Sentry account and get DSN
2. Configure environment variables
3. Test error reporting in development
4. Deploy to production with production DSN
5. Set up alerts and notifications
6. Monitor error rates and performance
