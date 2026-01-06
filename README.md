# SmartWidget - All-in-One Website Widget SaaS

SmartWidget is a comprehensive SaaS platform that provides appointment scheduling, contact forms, and AI chatbot capabilities through a single embeddable widget for websites.

## Features

### ✅ Implemented (Phase 1A, 1B, 1C, 1D, 1E Complete)

**Authentication & Dashboard:**
- Email/password registration and login with Clerk
- Protected dashboard routes with middleware
- Session management with Clerk Auth
- Responsive dashboard layout with sidebar navigation
- Enterprise-grade security with Clerk's built-in protections

**Appointment Types Manager:**
- Full CRUD operations for appointment types
- Configure duration, buffers, and colors
- Toggle active/inactive status

**Availability Settings:**
- Weekly schedule builder (set hours for each day)
- Timezone selector
- Date overrides for vacations and special hours

**Google Calendar Integration:**
- OAuth2 flow for connecting Google Calendar
- Automatic token refresh
- Create, update, and delete calendar events
- Conflict checking before booking
- Custom form responses in calendar event descriptions

**Appointment Booking System:**
- Available slots calculator API with intelligent caching
- Public appointment booking flow (4-step process)
- Appointment cancellation via token
- Calendar dashboard with month/week/day views
- Dashboard notifications for new bookings
- **Performance optimizations:**
  - Batch calendar conflict checking (10x faster)
  - Calendar events caching (15-min TTL)
  - Pre-warming system for next 5 days
  - Optimistic UI rendering (<100ms response time)

**Custom Booking Forms:**
- Visual form builder with drag-and-drop ordering
- Multiple field types: text, email, phone, textarea, dropdown, checkbox
- Required/optional field settings
- Custom placeholder text
- Dropdown options management
- Live preview mode
- Form responses saved with appointments

**Widget Customization:**
- Brand colors (primary, background, text)
- Border radius and font family settings
- Custom business name and welcome message
- Logo upload support
- Time format preferences (12h/24h)
- Required phone number toggle
- Show/hide notes field option
- Widget position and offset settings

**Contact Form Builder:**
- Full CRUD operations for custom forms
- Visual form builder with drag-and-drop ordering
- 8 field types: text, email, phone, number, url, textarea, dropdown, checkbox
- Required/optional field validation
- Custom placeholder text and field options
- Form settings (success message, email notifications)
- Active/inactive form toggle
- Submission viewer with status tracking
- IP address and user agent metadata
- Public form submission API

**Embeddable Widget System:**
- **Booking Widget**: Inline iframe embed for appointment booking
  - All appointment types or specific type
  - Full booking flow embedded on any webpage
  - Responsive design
- **Contact Forms**: Inline iframe embed for each form
  - Individual form embeds
  - Direct page integration
- **Embed Code Generator**: Dashboard page with copy-to-clipboard
  - Separate codes for booking and forms
  - Live preview links
  - Platform-specific instructions (WordPress, Shopify, Wix, Squarespace)
- **Reserved**: Floating button design for future AI chatbot

**Knowledge Base Manager:**
- Full CRUD operations for articles
- Rich text editor with markdown support
- Category organization
- Published/draft status control
- Article search and filtering
- Used by AI chatbot for FAQ responses

**AI Chatbot with Claude:**
- Conversational appointment scheduling using Claude Opus
- Tool calling integration for real-time availability checking
- Knowledge base integration for answering FAQs
- Lead qualification capabilities
- Customizable bot personality (name, greeting, tone, instructions)
- Advanced AI settings (max tokens, temperature, message limits)
- Usage tracking (messages, tokens, estimated costs)
- Auto-scroll chat interface
- Proactive date suggestions and timezone-aware scheduling
- Model locked to Claude Opus for optimal reasoning
- Embedded in widget with floating chat button

**Stripe Billing & Subscriptions:**
- Multi-tier subscription system (Free, Booking, Chatbot, Bundle)
- Usage-based metered billing for AI chatbot messages
- Stripe payment processing with automatic invoicing
- Subscription upgrade/downgrade with automatic proration
- Billing dashboard with usage tracking
- Customer portal for payment method management
- Subscription cancellation with period-end access retention
- Webhook integration for real-time subscription status updates

## Roadmap

### Phase 1A - Foundation ✅ (100% Complete)
- [x] Next.js setup with TypeScript and Tailwind v4
- [x] Prisma ORM v7 with PostgreSQL
- [x] Clerk authentication (migrated from NextAuth.js)
- [x] Dashboard layout
- [x] Appointment Types manager

### Phase 1B - Core Scheduling ✅ (100% Complete)
- [x] Availability settings
- [x] Google Calendar integration
- [x] Available slots calculator with caching
- [x] Public appointment booking flow
- [x] Appointments dashboard
- [x] Performance optimizations (batch checking, pre-warming, optimistic UI)

### Phase 1C - Forms & Widget ✅ (100% Complete)
- [x] Booking form builder (custom fields)
- [x] Widget customization (branding, colors, settings)
- [x] Dynamic form rendering in booking flow
- [x] Form responses saved with appointments
- [x] Contact form builder (standalone forms)
- [x] Form submission tracking and management
- [x] Embeddable widget system (iframe-based)
- [x] Inline booking widget embed
- [x] Inline contact form embed
- [x] Embed code generator with preview

### Phase 1E - Knowledge Base & AI Chatbot ✅ (100% Complete)
- [x] Knowledge base manager (articles, categories, rich text editor)
- [x] AI chatbot with Claude Opus
- [x] Conversational appointment scheduling with tool calling
- [x] Knowledge base integration for FAQ
- [x] Chatbot configuration and usage tracking
- [x] Embedded chat widget

### Phase 1D - Billing ✅ (100% Complete)
- [x] Stripe billing integration
- [x] Subscription plans and pricing (Free, Booking $29/mo, Chatbot $89/mo, Bundle $119/mo)
- [x] Usage-based metered billing for chatbot messages
- [x] Subscription upgrade/downgrade with proration
- [x] Billing dashboard with usage tracking
- [x] Customer portal integration
- [x] Webhook handling for subscription events

### Phase 2 - Advanced Features & Differentiation (Planned)

**Phase 2A - Payment & Booking Enhancements**
- [ ] Stripe payment processing for appointments
- [ ] Deposit system (partial payment at booking)
- [ ] Package booking (multiple sessions with bulk discounts)
- [ ] Dynamic pricing based on time slots or demand
- [ ] Coupon codes and promotional discounts

**Phase 2B - AI-Powered Lead Management**
- [ ] Smart lead scoring based on chat conversations
- [ ] Conversation analytics dashboard
- [ ] Automated lead nurturing via email
- [ ] AI-suggested follow-up messages
- [ ] No-show prediction and prevention

**Phase 2C - Multi-Channel Communication**
- [ ] SMS reminders and two-way messaging
- [ ] WhatsApp integration for booking
- [ ] Email workflow sequences (reminders, follow-ups, campaigns)
- [ ] In-chat rescheduling capability

**Phase 2D - Team & Enterprise Features**
- [ ] Round Robin scheduling (distribute across team members)
- [ ] Team workload balancing with AI
- [ ] Multi-calendar support (Outlook, Office 365, iCloud)
- [ ] Resource booking (rooms, equipment)
- [ ] Pooled team availability

**Phase 2E - Client Relationship Management**
- [ ] Built-in client database with history
- [ ] Client portal for viewing appointments
- [ ] Smart rebooking suggestions
- [ ] Client preferences and notes
- [ ] Birthday/anniversary automated outreach

**Phase 2F - Analytics & Business Intelligence**
- [ ] Booking conversion analytics
- [ ] Revenue tracking and forecasting
- [ ] Customer insights and demographics
- [ ] A/B testing for booking flows
- [ ] Performance dashboards

**Phase 2G - Industry-Specific Templates**
- [ ] Healthcare templates (HIPAA compliance, intake forms)
- [ ] Beauty/Salon templates (service combos, photo galleries)
- [ ] Legal templates (consultation types, document collection)
- [ ] Fitness/Coaching templates (package programs, progress tracking)
- [ ] Real Estate templates (property showings, virtual tours)

---

**Competitive Advantage:** SmartWidget is the only all-in-one scheduling platform with an AI-powered chatbot that qualifies leads, answers questions, and books appointments conversationally - while also providing contact forms and payment processing in a single embeddable widget.

---

## Security

SmartWidget implements enterprise-grade security measures to protect user data and prevent abuse.

**🎉 Production Ready - 88/100 Score** (Updated January 6, 2026)

### ✅ Implemented Security Features

**Authentication & Authorization:**
- ✅ **Clerk authentication** with enterprise-grade security (MIGRATED Dec 2025)
  - Multi-factor authentication (MFA) support
  - Password breach detection
  - Bot/brute-force protection
  - Email verification
  - Account lockout policies
  - OAuth social login support
- ✅ Row Level Security (RLS) enabled on all 18 database tables
- ✅ API route protection with Clerk session validation
- ✅ Resource ownership verification on all protected endpoints
- ✅ User ID extraction from Clerk sessions (`getCurrentUserId()`)

**Rate Limiting:**
- ✅ Upstash Redis-based rate limiting on all public endpoints
- ✅ **In-memory fallback** when Redis unavailable (Jan 6, 2026)
- ✅ Booking API: 10 requests/hour per IP
- ✅ Form submissions: 100 requests/hour per IP
- ✅ AI Chatbot: 30 messages/hour per IP (prevents API abuse)
- ✅ Availability checks: 300 requests/hour per IP
- ✅ Cancellations: 5 requests/hour per IP (prevents token brute-forcing)

**CSRF Protection:**
- ✅ **Cryptographic CSRF tokens** for all public endpoints (Jan 6, 2026)
- ✅ 32-byte secure tokens bound to client IP
- ✅ One-time use tokens stored in Redis with 1-hour expiry
- ✅ Protected: booking, form submissions, chatbot

**Data Protection:**
- ✅ Cryptographically secure cancellation tokens (64-byte random)
- ✅ **Calendar OAuth CSRF protection** with state tokens (Jan 6, 2026)
- ✅ **AES-256-GCM encryption** for form submissions with IV and auth tags
- ✅ Encrypted Google Calendar access tokens at rest
- ✅ **PII redaction** in application logs (emails, names, phone numbers)
- ✅ Environment variables properly secured (`.env.local` never committed)
- ✅ Secrets management with `.env.example` template

**Race Condition Prevention:**
- ✅ **Double booking prevention** with Serializable database transactions (Jan 6, 2026)
- ✅ **Token refresh locking** with distributed Redis locks (Jan 6, 2026)
- ✅ Atomic conflict checking and appointment creation

**API Resilience:**
- ✅ **Google Calendar API rate limit handling** (Jan 6, 2026)
- ✅ Exponential backoff with jitter (1s → 2s → 4s, max 10s)
- ✅ Retry logic for 429, 503, 500 errors
- ✅ Max 3 retry attempts per operation

**Network Security:**
- ✅ Security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options)
- ✅ SameSite=Strict cookies
- ✅ CORS configuration

**Abuse Prevention:**
- ✅ **hCaptcha** on public booking and contact forms (Jan 6, 2026)
- ✅ Email verification for new accounts (via Clerk)
- ✅ **Webhook idempotency** for Stripe/Clerk webhooks (Jan 6, 2026)
- ✅ **Database transactions** for all webhook handlers (Jan 6, 2026)

**Monitoring & Error Tracking:**
- ✅ **Sentry error tracking** for client and server (Jan 6, 2026)
- ✅ Structured Winston logging with PII redaction
- ✅ Comprehensive audit logging for state changes
- ✅ TypeScript strict mode (100% type safety)

**Input Validation:**
- ✅ Zod schema validation on all API routes
- ✅ Frontend validation with clear error messages
- ✅ Email format validation
- ✅ Required field checking

**Subscription & Feature Gating:**
- ✅ Subscription tier enforcement on all chatbot/knowledge base routes
- ✅ Usage limit checks (free: 25 bookings/month, 1 appointment type)
- ✅ Frontend conditional rendering based on subscription tier
- ✅ Upgrade prompts for paid features

### 📋 Optional Enhancements (MEDIUM Priority)

**Data Encryption:**
- [ ] AES-256 encryption for appointment visitor data (currently plaintext)
- [ ] Encryption key rotation procedures

**Database:**
- [ ] Foreign key CASCADE constraints
- [ ] Additional unique constraints (Availability, DateOverride)

### 📄 Security Documentation

For detailed security information:
- **Security Audit**: Contact repository maintainer for internal security documentation
- **RLS Migration**: See [migrations/enable_rls.sql](./migrations/enable_rls.sql)
- **Environment Setup**: See [.env.example](./.env.example)

### 🚨 Reporting Security Issues

If you discover a security vulnerability, please email the repository maintainer.

**Please do NOT create a public GitHub issue.**

We will acknowledge receipt within 48 hours and provide a detailed response within 7 days.

---

**Built with Next.js, Prisma, Clerk, Google Calendar API, Stripe, and Claude AI**
