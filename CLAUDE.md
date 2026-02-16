# Project Instructions

## Debugging

When debugging production issues, never assume the first error message is the root cause. Always check for masked/generic error handlers that may hide the actual error before proposing fixes.

## Database

This project uses Supabase with PgBouncer in production. Never use Prisma interactive transactions ($transaction with callbacks) — use sequential transactions or raw queries instead.

### Python/SQLAlchemy

When accessing SQLAlchemy ORM objects, always ensure they are accessed within an active session context. Eagerly load or convert to dicts/Pydantic models before closing the session to avoid DetachedInstanceError.

## Testing & Verification

When implementing multi-step fixes, always verify preconditions (e.g., subscription status, env variables, middleware configuration) before telling the user to test. Proactively list what needs to be true for the fix to work.

## Environment Variables

Whenever a change is made that requires a new or updated environment variable (in code, configuration, or dependencies), you MUST:

1. Clearly notify the user that an environment variable needs to be added or updated
2. Specify whether it applies to **production**, **development**, or both
3. Provide the exact variable name and value (or instructions on how to obtain the value)
4. Give step-by-step instructions for adding it in Vercel (Settings > Environment Variables)
5. Remind the user to **redeploy** after adding/updating environment variables, since `NEXT_PUBLIC_` vars are inlined at build time and server-side vars require a fresh deployment
