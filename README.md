# SmartWidget - All-in-One Website Widget SaaS

SmartWidget is a comprehensive SaaS platform that provides appointment scheduling, contact forms, and AI chatbot capabilities through a single embeddable widget for websites.

## Features

### ✅ Implemented (Phase 1A, 1B, 1C & Embed Complete)

**Authentication & Dashboard:**
- Email/password registration and login with NextAuth.js
- Protected dashboard routes with middleware
- Session management with JWT
- Responsive dashboard layout with sidebar navigation

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

## Roadmap

### Phase 1A - Foundation ✅ (100% Complete)
- [x] Next.js setup with TypeScript and Tailwind v4
- [x] Prisma ORM v7 with PostgreSQL
- [x] NextAuth.js authentication
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

### Phase 1D - AI & Billing (Planned)
- [ ] Knowledge base manager
- [ ] AI chatbot with Claude
- [ ] Stripe billing

---

**Built with Next.js, Prisma, Google Calendar API, and Claude AI**
