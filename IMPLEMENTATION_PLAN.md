# Production Launch Implementation Plan
**Goal:** Complete Critical + High Priority Issues for Production-Grade Launch
**Timeline:** 1-2 weeks (52-71 hours)
**Target Readiness:** 95/100
**Created:** January 5, 2026

---

## Overview

This plan addresses all critical and high-priority issues identified in `PRODUCTION_READINESS.md`. Work is organized into 3 phases with parallel execution where possible.

**Current Status:** 78/100
**Target Status:** 95/100
**Issues to Fix:** 10 tasks (2 critical + 8 high priority)

---

## Phase 1: Critical Security Blockers (6-8 hours)
**Strategy:** Sequential execution by main developer
**Timeline:** Day 1
**Dependencies:** None
**Blocking for:** Production launch

### Task 1.1: Fix Calendar OAuth CSRF Vulnerability
**Owner:** Main Developer (not delegated)
**Effort:** 3-4 hours
**Severity:** CRITICAL - Account takeover risk
**Status:** ❌ Not Started

**Why not delegated:** Security-critical, requires careful review and testing

**Implementation:**
1. Update `lib/google/oauth.ts`:
   - Generate cryptographically secure state token with `crypto.randomBytes(32)`
   - Store `state → userId` mapping in Redis with 10min TTL
   - Return secure state token in OAuth URL

2. Update `app/api/calendar/callback/route.ts`:
   - Validate state token exists in Redis
   - Retrieve userId from Redis
   - Delete token after one-time use
   - Return helpful error for invalid/expired tokens

**Files to modify:**
- `lib/google/oauth.ts` - Generate state token
- `app/api/calendar/callback/route.ts` - Validate state token

**Testing requirements:**
- [ ] Normal OAuth flow completes
- [ ] Expired state token rejected
- [ ] Invalid state token rejected
- [ ] State token reuse blocked
- [ ] Modified state parameter fails

**Success criteria:**
- State tokens are cryptographically secure (32 bytes)
- State stored in Redis with 10min expiry
- One-time use enforced
- Error messages helpful but not revealing

---

### Task 1.2: Fix Double Booking Race Condition
**Owner:** Main Developer (not delegated)
**Effort:** 3-4 hours
**Severity:** CRITICAL - Business credibility damage
**Status:** ❌ Not Started

**Why not delegated:** Business-critical, complex transaction logic with calendar integration

**Implementation:**
1. Update `app/api/appointments/book/route.ts`:
   - Wrap conflict check + appointment creation in `prisma.$transaction()`
   - Use `Serializable` isolation level
   - Check conflicts within transaction
   - Create appointment atomically
   - Include calendar event creation in transaction scope
   - Set 5-second transaction timeout

**Files to modify:**
- `app/api/appointments/book/route.ts` (lines 103-137)

**Testing requirements:**
- [ ] Concurrent bookings from 2 browser tabs
- [ ] 10+ concurrent API requests for same slot
- [ ] Only one booking succeeds
- [ ] Transaction rollback on calendar API failure
- [ ] No database deadlocks

**Success criteria:**
- Conflict check and creation are atomic
- Concurrent requests correctly detect conflicts
- User receives clear error when slot taken
- Transaction timeout < 5 seconds

---

## Phase 2: High Priority Parallel Work (40-57 hours)
**Strategy:** 3 agents + main developer working in parallel
**Timeline:** Days 2-7
**Dependencies:** Phase 1 complete

### 2A: Main Developer Tasks (9-13 hours)
**Why not delegated:** Security-critical or complex distributed systems

#### Task 2A.1: CSRF Protection for Public Endpoints
**Effort:** 4-6 hours
**Severity:** HIGH - Security vulnerability

**Implementation:**
1. Create `lib/csrf.ts`:
   - `generateCsrfToken()` - Create token, store in Redis (1hr expiry)
   - `validateCsrfToken()` - Verify and delete (one-time use)

2. Create `app/api/csrf/token/route.ts`:
   - Generate token tied to client IP
   - Return token to frontend

3. Update public API routes:
   - `app/api/appointments/book/route.ts` - Validate CSRF before booking
   - `app/api/forms/submit/route.ts` - Validate CSRF before submission
   - `app/api/chatbot/chat/route.ts` - Validate CSRF before chat

4. Update frontend components:
   - `app/book/[widgetId]/page.tsx` - Fetch + send CSRF token
   - Form components - Include CSRF token header

**Files to create:**
- `lib/csrf.ts`
- `app/api/csrf/token/route.ts`

**Files to modify:**
- `app/api/appointments/book/route.ts`
- `app/api/forms/submit/route.ts`
- `app/api/chatbot/chat/route.ts`
- `app/book/[widgetId]/page.tsx`

**Testing:**
- [ ] CSRF tokens validate correctly
- [ ] Invalid tokens rejected with 403
- [ ] One-time use enforced
- [ ] Tokens expire after 1 hour
- [ ] Clerk session cookies use SameSite=Lax

---

#### Task 2A.2: Token Refresh Race Condition Fix
**Effort:** 3-4 hours
**Severity:** HIGH - Calendar disconnections

**Implementation:**
1. Update `lib/google/calendar.ts`:
   - Add distributed locking before token refresh
   - Acquire Redis lock with 10-second expiry
   - If lock unavailable, wait 1s and retry (recursive)
   - Refresh token while holding lock
   - Release lock in finally block

**Files to modify:**
- `lib/google/calendar.ts` - `getValidConnection()` function

**Testing:**
- [ ] Only one refresh happens at a time
- [ ] Concurrent requests wait for refresh
- [ ] Lock auto-releases after 10s
- [ ] Lock released even if refresh fails
- [ ] Recursive retry works

---

#### Task 2A.3: Google Calendar API Rate Limit Handling
**Effort:** 2-3 hours
**Severity:** HIGH - System outage risk

**Implementation:**
1. Create `withRetry()` wrapper in `lib/google/calendar.ts`:
   - Exponential backoff: 1s, 2s, 4s (max 10s)
   - Retry on 429, 503, 500 errors
   - Fail immediately on other errors
   - Add jitter to prevent thundering herd
   - Max 3 retries

2. Wrap all Google Calendar API calls:
   - `createCalendarEvent()`
   - `deleteCalendarEvent()`
   - `updateCalendarEvent()`
   - `checkForConflicts()`

**Files to modify:**
- `lib/google/calendar.ts`

**Testing:**
- [ ] Retries work on 429/503/500
- [ ] Other errors fail immediately
- [ ] Exponential backoff with jitter
- [ ] Max 3 retries enforced
- [ ] Errors logged with attempt count

---

### 2B: Agent 1 - Infrastructure & Monitoring (4-5 hours)
**Delegation:** ✅ Can be handled by general-purpose agent
**Why delegated:** Well-defined, infrastructure setup, low coupling

#### Task 2B.1: Setup Sentry Error Tracking
**Effort:** 2-3 hours
**Agent type:** `general-purpose`

**Instructions for agent:**
```
Install and configure Sentry for production error tracking:

1. Install dependencies:
   npm install @sentry/nextjs

2. Run Sentry wizard:
   npx @sentry/wizard -i nextjs

3. Add environment variables to .env:
   NEXT_PUBLIC_SENTRY_DSN="https://...@sentry.io/..."
   SENTRY_AUTH_TOKEN="..."

4. Configure Sentry (created by wizard):
   - sentry.client.config.ts - Client-side config
   - sentry.server.config.ts - Server-side config
   - Filter PII in beforeSend hook

5. Update error boundary:
   - components/error-boundary.tsx
   - Add Sentry.captureException() to componentDidCatch

6. Create Sentry project and get DSN

Testing:
- Trigger test error in development
- Verify error appears in Sentry dashboard
- Confirm PII is filtered from reports
- Check source maps uploaded
```

**Acceptance criteria:**
- [ ] Sentry installed and configured
- [ ] Client-side errors captured
- [ ] Server-side errors captured
- [ ] PII filtered from reports
- [ ] Source maps uploaded
- [ ] Error alerting configured

---

#### Task 2B.2: Rate Limiting In-Memory Fallback
**Effort:** 2 hours
**Agent type:** `general-purpose`

**Instructions for agent:**
```
Add in-memory fallback for rate limiting when Redis is unavailable:

1. Update lib/rate-limit.ts:
   - Create Map<string, {count, reset}> for in-memory storage
   - Check if redis is unavailable
   - Use in-memory rate limiting as fallback
   - Log warning when using fallback
   - Clean up expired entries periodically

2. Implementation details from PRODUCTION_READINESS.md lines 1003-1056

Testing:
- Simulate Redis unavailability
- Verify rate limiting still works
- Confirm warning logged
- Check in-memory limits enforced per-instance
```

**Acceptance criteria:**
- [ ] Works with Redis available (normal mode)
- [ ] Works with Redis unavailable (fallback mode)
- [ ] Warning logged when using fallback
- [ ] In-memory limits per-instance
- [ ] No crashes on Redis errors

---

### 2C: Agent 2 - Webhook Reliability (5-7 hours)
**Delegation:** ✅ Can be handled by general-purpose agent
**Why delegated:** Straightforward database patterns, well-documented

#### Task 2C.1: Implement Webhook Idempotency
**Effort:** 3-4 hours
**Agent type:** `general-purpose`

**Instructions for agent:**
```
Prevent duplicate webhook processing:

1. Add WebhookEvent model to prisma/schema.prisma:
   - id, provider, eventId (unique), eventType, processed, createdAt
   - Index on [provider, eventId]

2. Run migration:
   npx prisma migrate dev --name add_webhook_event_log

3. Update app/api/stripe/webhook/route.ts:
   - Check if event.id already processed
   - Return early if processed
   - Create WebhookEvent record (processed: false)
   - Process webhook in transaction
   - Mark as processed within transaction
   - Don't mark processed if error occurred

4. Update app/api/webhooks/clerk/route.ts similarly

Implementation details in PRODUCTION_READINESS.md lines 833-911

Testing:
- Send duplicate webhook
- Verify only processes once
- Check both return 200
- Confirm transaction rollback on error
```

**Acceptance criteria:**
- [ ] WebhookEvent table created
- [ ] Duplicate events return 200 without processing
- [ ] Processing atomic with database transaction
- [ ] Failed processing doesn't mark as processed
- [ ] Works for both Stripe and Clerk webhooks

---

#### Task 2C.2: Add Database Transactions to Webhook Handlers
**Effort:** 2-3 hours
**Agent type:** `general-purpose`

**Instructions for agent:**
```
Wrap all webhook processing in database transactions:

1. Update app/api/stripe/webhook/route.ts:
   - Wrap each switch case in prisma.$transaction()
   - customer.subscription.created - atomic subscription creation
   - customer.subscription.updated - atomic updates
   - customer.subscription.deleted - atomic deletion
   - invoice.payment_succeeded - atomic payment processing
   - invoice.payment_failed - atomic failure handling

2. Update app/api/webhooks/clerk/route.ts:
   - Wrap user sync in transaction

Implementation examples in PRODUCTION_READINESS.md lines 927-986

Testing:
- Simulate database errors mid-processing
- Verify full rollback
- Confirm no partial updates
```

**Acceptance criteria:**
- [ ] All subscription webhooks use transactions
- [ ] All payment webhooks use transactions
- [ ] Clerk sync uses transaction
- [ ] Failed operations roll back completely

---

### 2D: Agent 3 - Bot Protection (4-6 hours)
**Delegation:** ✅ Can be handled by general-purpose agent
**Why delegated:** Standard integration, well-documented APIs

#### Task 2D.1: Add CAPTCHA to Public Forms
**Effort:** 4-6 hours
**Agent type:** `general-purpose`

**Instructions for agent:**
```
Implement hCaptcha on booking and contact forms:

1. Install dependencies:
   npm install @hcaptcha/react-hcaptcha

2. Add environment variables to .env:
   NEXT_PUBLIC_HCAPTCHA_SITE_KEY="..."
   HCAPTCHA_SECRET_KEY="..."

3. Create lib/captcha.ts:
   - verifyCaptcha(token, ip) function
   - Calls hCaptcha verify API
   - Returns boolean

4. Update frontend forms:
   - app/book/[widgetId]/page.tsx - Add HCaptcha component
   - Track captchaToken in state
   - Disable submit until verified

5. Update API validation:
   - app/api/appointments/book/route.ts - Verify captcha
   - app/api/forms/submit/route.ts - Verify captcha
   - Return 400 if verification fails

Implementation details in PRODUCTION_READINESS.md lines 1149-1240

Testing:
- Submit form without captcha (should fail)
- Submit with valid captcha (should succeed)
- Test on mobile device
- Test keyboard navigation
- Verify renders in Gmail/Outlook
```

**Acceptance criteria:**
- [ ] hCaptcha on booking form
- [ ] hCaptcha on contact forms
- [ ] Backend verifies tokens
- [ ] Invalid tokens rejected
- [ ] User-friendly errors
- [ ] Accessible (keyboard nav)
- [ ] Mobile-friendly

---

## Phase 3: Email Testing & Validation (4-6 hours)
**Strategy:** Main developer + testing
**Timeline:** When domain available
**Dependencies:** Domain verification complete

### Task 3.1: Email System Production Testing
**Owner:** Main Developer
**Effort:** 4-6 hours
**Status:** ⏳ Waiting on domain

**Prerequisites:**
1. Domain purchased/configured
2. Resend account created
3. Domain verified (DNS SPF/DKIM)
4. RESEND_API_KEY obtained

**Implementation:**
1. Configure Resend:
   - Add DNS records for domain verification
   - Get API key
   - Add to .env and Cloudflare environment variables

2. Update code:
   - Update `FROM_EMAIL` in `lib/email.ts` to actual domain

3. Deploy Cloudflare Worker:
   ```bash
   cd workers
   npx wrangler deploy
   npx wrangler secret put CRON_SECRET
   npx wrangler secret put NEXT_PUBLIC_APP_URL
   ```

4. Test all email types:
   - [ ] Booking confirmation (customer)
   - [ ] Booking notification (business owner)
   - [ ] 24h appointment reminder
   - [ ] Cancellation confirmation
   - [ ] Form submission notification
   - [ ] Payment failure alert

5. Email client testing:
   - [ ] Gmail rendering
   - [ ] Outlook rendering
   - [ ] Apple Mail rendering
   - [ ] Mobile devices

6. Deliverability testing:
   - [ ] Not in spam folder
   - [ ] SPF/DKIM passing
   - [ ] Links work correctly
   - [ ] Cancel appointment flow works

**Success criteria:**
- All 6 email types send successfully
- Deliverability > 95%
- Render correctly in all major clients
- Cron job triggers reminders
- Error handling graceful

---

### Task 3.2: End-to-End Production Testing
**Owner:** Main Developer + Team
**Effort:** 8-12 hours
**Timeline:** Days 8-9

**Test scenarios:**

**Critical Path Testing:**
1. [ ] New user signup → Complete onboarding
2. [ ] Connect Google Calendar → OAuth flow
3. [ ] Create appointment type
4. [ ] Set availability
5. [ ] Book appointment (customer perspective)
6. [ ] Receive confirmation email
7. [ ] Appointment appears in Google Calendar
8. [ ] Cancel appointment
9. [ ] Receive cancellation email

**Security Testing:**
1. [ ] OAuth CSRF - Try modified state parameter
2. [ ] Double booking - Concurrent requests
3. [ ] CSRF - Invalid token rejected
4. [ ] Rate limiting - Exceed limits
5. [ ] CAPTCHA - Submit without verification

**Reliability Testing:**
1. [ ] Token refresh - Concurrent requests
2. [ ] Calendar API - Simulate 429 errors
3. [ ] Webhook idempotency - Send duplicate
4. [ ] Database transaction - Simulate failures

**Performance Testing:**
1. [ ] API response times < 500ms p95
2. [ ] Database query times < 100ms p95
3. [ ] Email send times < 500ms
4. [ ] No N+1 queries

**Monitoring:**
1. [ ] Sentry capturing errors
2. [ ] Logs show PII redaction
3. [ ] Rate limits working
4. [ ] Calendar sync success rate > 98%

---

## Task Delegation Summary

### Main Developer Tasks (Sequential - 25-33 hours)
1. ✅ Calendar OAuth CSRF (3-4 hours)
2. ✅ Double Booking Race Condition (3-4 hours)
3. ✅ CSRF Protection (4-6 hours)
4. ✅ Token Refresh Locking (3-4 hours)
5. ✅ Calendar API Rate Limits (2-3 hours)
6. ✅ Email Testing when domain ready (4-6 hours)
7. ✅ End-to-end testing (6-6 hours)

### Agent 1: Infrastructure (Parallel - 4-5 hours)
1. 🤖 Sentry Setup (2-3 hours)
2. 🤖 Rate Limiting Fallback (2 hours)

### Agent 2: Webhooks (Parallel - 5-7 hours)
1. 🤖 Webhook Idempotency (3-4 hours)
2. 🤖 Database Transactions (2-3 hours)

### Agent 3: Security (Parallel - 4-6 hours)
1. 🤖 CAPTCHA Implementation (4-6 hours)

**Total Estimated Time:** 38-51 hours (developer) + 13-18 hours (agents in parallel)
**Wall Clock Time:** ~1-2 weeks with parallel execution

---

## Execution Strategy

### Week 1: Critical + Main Developer Work

**Day 1 (6-8 hours):**
- Morning: Fix Calendar OAuth CSRF
- Afternoon: Fix Double Booking Race Condition
- Test both fixes thoroughly

**Day 2 (4-6 hours):**
- Implement CSRF Protection
- Test public endpoints

**Day 3 (3-4 hours):**
- Token Refresh Locking
- Test concurrent token refreshes

**Day 4 (2-3 hours):**
- Calendar API Rate Limits
- Test with simulated API errors

**Day 5 (Agents work in parallel):**
- Launch Agent 1: Sentry + Rate Limit Fallback
- Launch Agent 2: Webhook Idempotency + Transactions
- Launch Agent 3: CAPTCHA Implementation
- Developer: Review agent outputs, fix issues

### Week 2: Testing + Domain Setup

**Day 6-7:**
- Domain configuration
- Resend setup
- Email testing

**Day 8-9:**
- End-to-end testing
- Performance testing
- Security validation

**Day 10:**
- Production deployment
- Post-deployment monitoring

---

## Dependencies & Blockers

**Critical Blockers:**
- None for Phase 1 and Phase 2
- Domain availability blocks email testing (Phase 3)

**Task Dependencies:**
- Email testing requires: Domain verification
- End-to-end testing requires: All Phase 1 & 2 complete
- Agent work can start immediately (no blockers)

**External Dependencies:**
- Resend account approval (usually instant)
- DNS propagation (24-48 hours)
- hCaptcha account (instant)
- Sentry account (instant)

---

## Risk Mitigation

**Risk: Agent implementations need fixes**
- Mitigation: Review all agent work before merging
- Time buffer: 4-6 hours for fixes

**Risk: Domain setup delayed**
- Mitigation: Continue other work, email testing is last
- Workaround: Use Resend test mode initially

**Risk: Complex bugs during testing**
- Mitigation: 2-day buffer for testing phase
- Escalation: Defer non-critical issues to v1.1

**Risk: Production deployment issues**
- Mitigation: Test in staging first
- Rollback plan: Keep previous deployment ready

---

## Success Metrics

**Code Quality:**
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] Linting clean
- [ ] No security vulnerabilities

**Performance:**
- [ ] API response time < 500ms (p95)
- [ ] Database queries < 100ms (p95)
- [ ] Error rate < 0.1%

**Security:**
- [ ] All OWASP Top 10 addressed
- [ ] CSRF protection verified
- [ ] OAuth flows secure
- [ ] PII encrypted/redacted

**Production Readiness:**
- [ ] Score improved from 78/100 to 95/100
- [ ] All critical issues resolved
- [ ] All high priority issues resolved
- [ ] Email system tested and working

---

## Next Steps

1. **Review this plan** - Confirm approach and timeline
2. **Start Phase 1** - Begin Calendar OAuth CSRF fix
3. **Launch agents** - Spin up 3 agents for parallel work in Phase 2
4. **Monitor progress** - Daily standup to review agent outputs
5. **Domain setup** - Begin domain acquisition process
6. **Testing** - Comprehensive testing before production

**Questions:**
- Which domain to use for email?
- Who creates Sentry/hCaptcha accounts?
- Deployment target date?
- Beta testing group available?
