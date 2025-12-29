# SmartWidget - All-in-One Website Widget SaaS

SmartWidget is a comprehensive SaaS platform that provides appointment scheduling, contact forms, and AI chatbot capabilities through a single embeddable widget for websites.

## Features

### ✅ Implemented (Phase 1A & 1B - Partial)

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

### 🚧 In Progress

- Available slots calculator
- Public appointment booking flow
- Appointments calendar dashboard

## Roadmap

### Phase 1A - Foundation ✅ (100% Complete)
- [x] Next.js setup with TypeScript and Tailwind v4
- [x] Prisma ORM v7 with PostgreSQL
- [x] NextAuth.js authentication
- [x] Dashboard layout
- [x] Appointment Types manager

### Phase 1B - Core Scheduling 🚧 (60% Complete)
- [x] Availability settings
- [x] Google Calendar integration
- [ ] Available slots calculator
- [ ] Public appointment booking flow
- [ ] Appointments dashboard

### Phase 1C - Forms & Widget (Planned)
- [ ] Contact form builder
- [ ] Embeddable widget
- [ ] Widget customization

### Phase 1D - AI & Billing (Planned)
- [ ] Knowledge base manager
- [ ] AI chatbot with Claude
- [ ] Stripe billing

---

**Built with Next.js, Prisma, Google Calendar API, and Claude AI**
