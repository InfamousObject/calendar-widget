# SmartWidget - All-in-One Website Widget SaaS

SmartWidget is a comprehensive SaaS platform that provides appointment scheduling, contact forms, and AI chatbot capabilities through a single embeddable widget for websites.

## Features

### ✅ Implemented

- **User Authentication**
  - Email/password registration and login
  - Protected dashboard routes
  - Session management with NextAuth.js

- **Dashboard**
  - Responsive layout with sidebar navigation
  - User profile and logout functionality
  - Stats overview

- **Appointment Types Manager**
  - Create, edit, and delete appointment types
  - Configure duration, buffers, and colors
  - Toggle active/inactive status

### 🚧 In Progress

- Google Calendar integration
- Availability settings
- Appointment booking flow
- Contact form builder
- Embeddable widget
- AI chatbot with Claude
- Stripe billing integration

## Tech Stack

**Frontend:**
- Next.js 14+ (App Router)
- React 18+ with TypeScript
- Tailwind CSS
- shadcn/ui components
- Zustand (planned for state management)

**Backend:**
- Next.js API routes
- PostgreSQL database
- Prisma ORM
- NextAuth.js for authentication

**Third-Party Services:**
- Anthropic Claude API (for chatbot)
- Google Calendar API (planned)
- Microsoft Graph API (planned)
- Resend/SendGrid (planned for emails)
- Stripe (planned for billing)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd calendar-widget
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the root directory:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/smartwidget?schema=public"

   # NextAuth
   NEXTAUTH_SECRET="your-secret-key-here"  # Generate with: openssl rand -base64 32
   NEXTAUTH_URL="http://localhost:3000"

   # Google Calendar OAuth (optional for now)
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"

   # Microsoft OAuth (optional for now)
   MICROSOFT_CLIENT_ID="your-microsoft-client-id"
   MICROSOFT_CLIENT_SECRET="your-microsoft-client-secret"

   # Email Service (optional for now)
   RESEND_API_KEY="your-resend-api-key"

   # Anthropic AI (optional for now)
   ANTHROPIC_API_KEY="your-anthropic-api-key"

   # Stripe (optional for now)
   STRIPE_SECRET_KEY="your-stripe-secret-key"
   STRIPE_WEBHOOK_SECRET="your-stripe-webhook-secret"
   STRIPE_PUBLISHABLE_KEY="your-stripe-publishable-key"

   # App Configuration
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   NEXT_PUBLIC_WIDGET_URL="http://localhost:3000/widget.js"
   ```

4. **Set up the database**

   Make sure PostgreSQL is running, then run:
   ```bash
   # Note: Prisma CLI may have network restrictions in some environments
   # If you encounter issues, you may need to set up the database manually
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
/calendar-widget
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   └── appointment-types/  # Appointment type CRUD
│   ├── auth/             # Auth pages (login, register)
│   ├── dashboard/        # Protected dashboard pages
│   └── page.tsx          # Landing page
├── components/
│   ├── dashboard/        # Dashboard-specific components
│   └── ui/               # Reusable UI components
├── lib/
│   ├── types/            # TypeScript type definitions
│   ├── auth.ts           # NextAuth configuration
│   ├── auth-utils.ts     # Auth helper functions
│   ├── prisma.ts         # Prisma client singleton
│   └── utils.ts          # Utility functions
├── prisma/
│   └── schema.prisma     # Database schema
├── public/               # Static assets
├── middleware.ts         # Route protection middleware
└── package.json
```

## Database Schema

The application uses Prisma ORM with the following main models:

- **User** - User accounts and authentication
- **Subscription** - User subscription plans
- **AppointmentType** - Types of appointments users can offer
- **Appointment** - Scheduled appointments
- **Availability** - User availability schedule
- **DateOverride** - Special dates (vacations, etc.)
- **CalendarConnection** - Google/Outlook calendar integrations
- **Form** - Contact form definitions
- **FormSubmission** - Form submission data
- **WidgetConfig** - Widget customization settings
- **ChatbotConfig** - AI chatbot configuration
- **KnowledgeBase** - Chatbot knowledge base
- **Conversation** - Chatbot conversations

## Usage

### Creating an Account

1. Navigate to `/auth/register`
2. Fill in your information
3. You'll be automatically logged in and redirected to the dashboard

### Managing Appointment Types

1. Go to **Dashboard > Appointments**
2. Click "New Appointment Type"
3. Configure:
   - Name (e.g., "30-min Consultation")
   - Duration in minutes
   - Optional description
   - Color for calendar display
   - Buffer times before/after
4. Click "Create"

Your appointment type will appear in the list and can be edited or deleted at any time.

## Development

### Running Tests

```bash
npm test
```

### Building for Production

```bash
npm run build
npm start
```

### Database Migrations

When you make changes to `prisma/schema.prisma`:

```bash
npx prisma generate
npx prisma db push
```

## Roadmap

### Phase 1 (Current)
- [x] Project setup and authentication
- [x] Dashboard layout
- [x] Appointment types manager
- [ ] Availability settings
- [ ] Google Calendar integration
- [ ] Appointment booking API
- [ ] Contact form builder
- [ ] Embeddable widget
- [ ] Widget customization
- [ ] Basic AI chatbot
- [ ] Stripe billing

### Phase 2 (Future)
- [ ] Microsoft Outlook integration
- [ ] Email notifications
- [ ] SMS reminders
- [ ] Advanced chatbot features
- [ ] Analytics dashboard
- [ ] Multi-language support
- [ ] White-label options

## Contributing

This is a private project. If you have access and want to contribute:

1. Create a feature branch from `main`
2. Make your changes
3. Submit a pull request

## License

Proprietary - All rights reserved

## Support

For issues or questions, please open an issue on GitHub.

---

Built with ❤️ using Next.js, Prisma, and Claude AI
