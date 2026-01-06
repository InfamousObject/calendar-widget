# Phase 4: PII Redaction in Logs - Implementation Plan

**Last Updated:** 2026-01-05
**Status:** Ready for implementation
**Estimated Time:** 14-16 hours

---

## Problem Summary

**Current State:**
- 192 console.* statements across 57 files
- 35+ statements logging PII (emails, names, phone numbers, user IDs)
- 15+ critical PII exposures (full request bodies, visitor data)
- No logging library or structured logging
- Inconsistent log formatting and no redaction

**Security Risks:**
1. **Email addresses** logged in plaintext during auth failures
2. **Full request bodies** logged containing visitor PII (name, email, phone)
3. **User IDs** correlated with sensitive activities
4. **Booking data** with complete visitor information
5. **Webhook data** exposing subscription details

**Compliance Impact:**
- GDPR violation: Personal data in application logs
- CCPA non-compliance: No PII protection in logging
- SOC 2 audit failure: Sensitive data exposure in logs

---

For the complete implementation plan including code examples, file-by-file updates, testing procedures, and rollback strategies, see:

**C:\Users\Owner\.claude\plans\warm-hatching-origami.md**

---

## Quick Reference

### Time Estimate: 14-16 hours

**Day 1: Setup (1 hour)**
- Install Winston logger
- Create logger utility with PII redaction
- Test redaction functions

**Day 2: Priority 1 Files (2 hours)**
- Fix 5 critical PII exposures
- Test with real booking flow

**Days 3-4: Batch Updates (4 hours)**
- Auth & User, Appointments, Forms batches

**Days 5-6: Batch Updates (4 hours)**
- Billing, Calendar, Chatbot batches

**Day 7: Final Batch + Verification (3 hours)**
- Availability, Cache, Library files
- Full system test

### Key Files

**New File:**
- `lib/logger.ts` - PII-safe logging utility with Winston

**Priority 1 (Critical):**
1. `app/api/appointments/book/route.ts`
2. `lib/claude.ts`
3. `lib/auth.ts`
4. `app/api/sync-user/route.ts`
5. `app/api/forms/submit/route.ts`

**Total Scope:**
- 57 files
- 192 console.* statements
- 9 batches organized by functionality

### PII Redaction Features

- Email masking: `user@example.com` → `u***@e***.com`
- User ID masking: `user_abc123def` → `user_abc***`
- Phone masking: `555-1234-5678` → `***-***-5678`
- Deep object scanning for PII fields
- Environment-based log levels

### Success Criteria

- [ ] Winston logger installed
- [ ] PII redaction utility created
- [ ] All 192 console.* statements replaced
- [ ] Emails/phones/IDs masked in logs
- [ ] No full request bodies logged
- [ ] GDPR/CCPA/SOC 2 compliant logging

### Compliance Benefits

- **GDPR Article 32:** PII protection at rest
- **CCPA Section 1798.150:** Reasonable security procedures
- **SOC 2 CC6.7:** Restricts access to sensitive information
- **ISO 27001 A.12.4.1:** Event logging protects confidentiality

---

**For detailed implementation instructions, see the full plan file.**
