# SmartWidget Frontend Design Improvements

## Executive Summary
This document outlines specific design improvements to transform SmartWidget from a generic SaaS interface into a distinctive, memorable product.

---

## 🎉 Implementation Status

### ✅ COMPLETED (Phase 1 & 2)

**Phase 1: Foundation (Typography & Colors)**
- ✅ Typography System - Instrument Serif (display) + Space Grotesk (body)
- ✅ Color System - Deep Indigo, Warm Amber, Rich Emerald jewel tones
- ✅ Global CSS Variables - Custom color palette and typography utilities
- ✅ Animation Keyframes - fadeInUp, shimmer, pulse-glow, spinner animations
- ✅ Toast Notifications - Replaced alert() with sonner toast throughout

**Phase 2: Components & Interactions**
- ✅ Dashboard Page - Gradient hero section, animated stats cards, enhanced bookings
- ✅ Booking Page - Enhanced progress indicator, date/time selection, confirmation screen
- ✅ Pricing Page - All tier cards with hover effects, gradients, and perfect alignment
- ✅ Navigation Sidebar - Gradient logo, active indicators, hover animations
- ✅ Setup Checklist - Animated progress bar, gradient backgrounds, task cards
- ✅ Loading States - Skeleton loaders and dual-ring spinners
- ✅ Micro-interactions - Scale, translate, shadow, and gradient hover effects

**Files Modified:**
- `app/layout.tsx` - Typography system
- `app/globals.css` - Color variables and animations
- `app/dashboard/page.tsx` - Enhanced dashboard
- `app/book/[widgetId]/page.tsx` - Enhanced booking flow
- `app/pricing/page.tsx` - Polished pricing cards with alignment fixes
- `components/dashboard/dashboard-nav.tsx` - Enhanced navigation
- `components/dashboard/setup-checklist.tsx` - Polished checklist

**Phase 3: Auth Pages** ✅ JUST COMPLETED
- ✅ Login Page - Gradient background, branded header, custom Clerk styling
- ✅ Register Page - Trust indicators, accent-focused gradients, animations
- ✅ Error Page - Error-themed design, multiple action buttons, help links

**Files Modified:**
- `app/auth/login/page.tsx` - Enhanced login experience
- `app/auth/register/page.tsx` - Enhanced registration with trust signals
- `app/auth/error/page.tsx` - Polished error handling

### 📋 READY TO IMPLEMENT (Phase 4 Options)

**Option A: Expand to Dashboard Pages** (Recommended for consistency)
- Appointments page - Apply design system to appointment management
- Forms management - Enhanced form builder and list views
- Calendar page - Polished calendar connection interface
- Chatbot page - Enhanced chatbot configuration
- Availability page - Improved availability settings
- Billing page - Professional billing and subscription management
- Mobile responsive refinements

**Option B: Advanced Interactions** (For extra polish)
- Page transitions with framer-motion
- Advanced scroll animations
- More sophisticated micro-interactions
- Interactive data visualizations

**Option C: Accessibility & Performance** (For production readiness)
- Accessibility audit and improvements
- Performance optimization (animation performance, bundle size)
- Browser compatibility testing
- Mobile device testing

---

## 1. Typography System

### Current Issues
- Geist fonts are becoming generic (the new Inter)
- Lacks personality and hierarchy
- No distinctive voice

### Proposed Solution: "Editorial Typography"

**Font Stack:**
```typescript
// app/layout.tsx - Replace Geist imports
import { Space_Grotesk, Instrument_Serif } from "next/font/google";

const displayFont = Instrument_Serif({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
});

const sansFont = Space_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

// In body tag
className={`${displayFont.variable} ${sansFont.variable} antialiased`}
```

**Tailwind Config Update:**
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-lg': ['4.5rem', { lineHeight: '1', letterSpacing: '-0.02em' }],
        'display-md': ['3.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-sm': ['2.5rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
      },
    },
  },
};
```

**Implementation Example (Dashboard):**
```tsx
// app/dashboard/page.tsx - Line 114-120
<div>
  <h2 className="font-display text-display-sm font-semibold tracking-tight">
    Welcome back, {user?.firstName || 'there'}
  </h2>
  <p className="text-lg text-muted-foreground font-light mt-2">
    Here's what's happening with your appointments
  </p>
</div>
```

---

## 2. Color System: Rich & Distinctive

### Current Issues
- Too muted, lacks personality
- Generic primary/secondary/muted palette
- No brand distinction

### Proposed Solution: "Deep Jewel Tones"

**Enhanced Color Variables:**
```css
/* app/globals.css - Add to :root */
:root {
  /* Primary: Deep Indigo */
  --primary: 239 84% 67%;
  --primary-foreground: 0 0% 100%;

  /* Accent: Warm Amber */
  --accent: 38 92% 50%;
  --accent-foreground: 0 0% 100%;

  /* Success: Rich Emerald */
  --success: 158 64% 52%;

  /* Warning: Vibrant Orange */
  --warning: 25 95% 53%;

  /* Backgrounds with depth */
  --background: 0 0% 100%;
  --background-subtle: 240 20% 99%;
  --surface: 0 0% 100%;
  --surface-elevated: 0 0% 100%;

  /* Borders with color */
  --border: 240 6% 90%;
  --border-strong: 240 10% 80%;

  /* Text hierarchy */
  --foreground: 240 10% 3.9%;
  --foreground-secondary: 240 5% 26%;
  --foreground-tertiary: 240 4% 46%;
}

.dark {
  /* Primary: Brighter Indigo for dark */
  --primary: 239 84% 75%;

  /* Rich dark backgrounds */
  --background: 240 10% 3.9%;
  --background-subtle: 240 10% 6%;
  --surface: 240 8% 10%;
  --surface-elevated: 240 8% 15%;

  /* Glowing borders */
  --border: 240 8% 20%;
  --border-strong: 240 10% 30%;
}

/* Gradient utilities */
.gradient-mesh {
  background:
    radial-gradient(at 0% 0%, hsl(239, 84%, 67%) 0px, transparent 50%),
    radial-gradient(at 100% 0%, hsl(158, 64%, 52%) 0px, transparent 50%),
    radial-gradient(at 100% 100%, hsl(25, 95%, 53%) 0px, transparent 50%),
    radial-gradient(at 0% 100%, hsl(239, 84%, 67%) 0px, transparent 50%);
  opacity: 0.15;
  filter: blur(80px);
}
```

---

## 3. Dashboard Redesign

### Stats Cards with Personality

**Replace generic stat cards (Lines 126-140) with:**

```tsx
// app/dashboard/page.tsx - Enhanced stat cards
const statCards = [
  {
    title: 'Total Appointments',
    value: stats.appointments,
    icon: Calendar,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    trend: '+12%',
    trendUp: true,
  },
  // ... other stats
];

return (
  <div className="space-y-8">
    {/* Hero Section with Gradient Background */}
    <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-background to-accent/5 p-8">
      <div className="gradient-mesh absolute inset-0 -z-10" />

      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-4xl font-semibold tracking-tight mb-3">
              Welcome back, {user?.firstName || 'there'}
            </h2>
            <p className="text-lg text-foreground-secondary font-light max-w-2xl">
              {recentBookings.filter(b => b.isNew).length > 0
                ? `You have ${recentBookings.filter(b => b.isNew).length} new booking${recentBookings.filter(b => b.isNew).length !== 1 ? 's' : ''} waiting for you`
                : "Here's your scheduling overview for today"}
            </p>
          </div>

          {/* Quick action button */}
          <Button
            size="lg"
            className="gap-2 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
            onClick={() => router.push('/dashboard/appointments')}
          >
            <span>New Appointment</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>

    {/* Setup Checklist */}
    <SetupChecklist />

    {/* Enhanced Stats Grid with Animations */}
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card
            key={stat.title}
            className="group relative overflow-hidden border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground-secondary">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor} transition-transform duration-300 group-hover:scale-110`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold font-display tracking-tight">
                  {stat.value}
                </div>
                {stat.trend && (
                  <span className={`text-sm font-medium ${stat.trendUp ? 'text-success' : 'text-warning'}`}>
                    {stat.trend}
                  </span>
                )}
              </div>
              <p className="text-xs text-foreground-tertiary mt-1">
                vs last month
              </p>
            </CardContent>

            {/* Subtle gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          </Card>
        );
      })}
    </div>

    {/* Recent Bookings with Enhanced Design */}
    {recentBookings.filter((b) => b.isNew).length > 0 && (
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl font-display">New Bookings</CardTitle>
                <CardDescription className="text-sm">
                  {recentBookings.filter((b) => b.isNew).length} appointment{recentBookings.filter((b) => b.isNew).length !== 1 ? 's' : ''} pending review
                </CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <a href="/dashboard/bookings">View all</a>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentBookings
              .filter((b) => b.isNew)
              .map((booking, index) => (
                <div
                  key={booking.id}
                  className="group flex items-start justify-between rounded-xl border border-border bg-surface p-4 transition-all duration-300 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start gap-4 flex-1">
                    {/* Avatar placeholder */}
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-white font-semibold text-sm">
                      {booking.visitorName.split(' ').map(n => n[0]).join('')}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground mb-1">
                        {booking.visitorName}
                      </p>
                      <p className="text-sm text-foreground-secondary mb-1">
                        {booking.appointmentType}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-foreground-tertiary">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(booking.startTime).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    onClick={() => router.push('/dashboard/bookings')}
                  >
                    View
                  </Button>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    )}

    {/* Booking Link Card with Copy Animation */}
    {widgetId && (
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="font-display text-2xl">Your Booking Page</CardTitle>
          <CardDescription>
            Share this link for customers to book appointments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex gap-2">
              <div className="flex-1 relative group">
                <code className="block rounded-lg border border-border bg-surface p-4 text-sm font-mono overflow-x-auto transition-colors duration-200 group-hover:border-primary/30">
                  {`${window.location.origin}/book/${widgetId}`}
                </code>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-auto aspect-square hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/book/${widgetId}`);
                  toast.success('Copied to clipboard!', {
                    description: 'Share this link with your customers',
                  });
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-auto aspect-square hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200"
                onClick={openBookingPage}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )}

    {/* Quick Actions with Hover Effects */}
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-2xl">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { href: '/dashboard/appointments', icon: Calendar, label: 'Manage Appointments', color: 'primary' },
            { href: '/dashboard/forms', icon: FileText, label: 'Create Form', color: 'accent' },
            { href: '/dashboard/widget', icon: MessageSquare, label: 'Customize Widget', color: 'success' },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <a
                key={action.href}
                href={action.href}
                className="group relative flex flex-col items-center justify-center rounded-xl border border-border p-8 text-center transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1"
              >
                <div className="mb-4 p-4 rounded-xl bg-primary/10 transition-all duration-300 group-hover:bg-primary group-hover:scale-110">
                  <Icon className="h-8 w-8 text-primary transition-colors duration-300 group-hover:text-primary-foreground" />
                </div>
                <span className="font-semibold text-foreground group-hover:text-primary transition-colors duration-300">
                  {action.label}
                </span>

                {/* Arrow on hover */}
                <ArrowRight className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
              </a>
            );
          })}
        </div>
      </CardContent>
    </Card>
  </div>
);
```

**Add animations CSS:**
```css
/* app/globals.css - Add these animations */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}

.animate-fade-in-up {
  animation: fadeInUp 0.6s ease-out forwards;
}

.animate-shimmer {
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.1) 50%,
    transparent 100%
  );
  background-size: 1000px 100%;
  animation: shimmer 2s infinite;
}
```

---

## 4. Booking Page Enhancement

### Issues with Current Design
- Generic stepper with circles (Lines 416-437)
- Plain button grids for dates/times
- No personality or warmth
- Basic loading states

### Proposed Solution: "Conversational Booking Flow"

**Enhanced Progress Indicator:**
```tsx
// app/book/[widgetId]/page.tsx - Replace Lines 416-437
{/* Enhanced Progress Indicator */}
<div className="relative mb-12">
  <div className="absolute left-0 right-0 top-4 h-0.5 bg-border">
    <div
      className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
      style={{ width: `${((step - 1) / 3) * 100}%` }}
    />
  </div>

  <div className="relative flex items-center justify-between">
    {[
      { num: 1, label: 'Service' },
      { num: 2, label: 'Time' },
      { num: 3, label: 'Details' },
      { num: 4, label: 'Confirm' },
    ].map((s) => (
      <div key={s.num} className="flex flex-col items-center gap-2">
        <div
          className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
            step >= s.num
              ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/30'
              : step === s.num - 1
              ? 'bg-background border-primary/50 text-primary scale-110'
              : 'bg-background border-border text-foreground-tertiary'
          }`}
        >
          {step > s.num ? (
            <Check className="h-5 w-5" />
          ) : (
            <span className="text-sm font-semibold">{s.num}</span>
          )}
        </div>
        <span className={`text-xs font-medium transition-colors duration-300 ${
          step >= s.num ? 'text-primary' : 'text-foreground-tertiary'
        }`}>
          {s.label}
        </span>
      </div>
    ))}
  </div>
</div>
```

**Enhanced Date Selection (Replace Lines 544-564):**
```tsx
{!selectedDate ? (
  <>
    {loadingDates ? (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
          <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
        <p className="text-foreground-secondary">Finding available dates...</p>
      </div>
    ) : availableDates.length === 0 ? (
      <div className="py-12 px-4">
        <div className="max-w-md mx-auto rounded-2xl border border-warning/20 bg-gradient-to-br from-warning/5 to-background p-8 text-center">
          <div className="inline-flex p-4 rounded-full bg-warning/10 mb-4">
            <AlertCircle className="h-8 w-8 text-warning" />
          </div>
          <h3 className="font-display text-2xl font-semibold text-foreground mb-3">
            No Available Dates
          </h3>
          <p className="text-foreground-secondary">
            This calendar doesn't have any available booking dates configured yet.
            Please check back later or contact the business directly.
          </p>
        </div>
      </div>
    ) : (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {availableDates.map((date, index) => {
          const parsedDate = parseISO(date);
          const isToday = format(new Date(), 'yyyy-MM-dd') === date;

          return (
            <button
              key={date}
              onClick={() => handleSelectDate(date)}
              className="group relative h-auto py-6 px-4 flex flex-col items-center gap-2 rounded-xl border-2 border-border bg-surface transition-all duration-300 hover:border-primary hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              {isToday && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                  Today
                </span>
              )}

              <span className="text-xs font-medium text-foreground-tertiary group-hover:text-primary transition-colors">
                {format(parsedDate, 'EEE')}
              </span>
              <span className="text-3xl font-display font-bold text-foreground group-hover:text-primary transition-colors">
                {format(parsedDate, 'd')}
              </span>
              <span className="text-xs text-foreground-tertiary">
                {format(parsedDate, 'MMM')}
              </span>
            </button>
          );
        })}
      </div>
    )}
  </>
) : (
  // Time slots with enhanced design (Replace Lines 567-623)
  <>
    {validating && optimisticSlots.length > 0 && (
      <div className="mb-4 flex items-center justify-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
        <div className="relative w-5 h-5">
          <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
          <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
        <span className="text-sm font-medium text-primary">
          Validating availability with your calendar...
        </span>
      </div>
    )}

    {loadingSlots && optimisticSlots.length === 0 ? (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
          <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
        <p className="text-foreground-secondary">Loading available times...</p>
      </div>
    ) : optimisticSlots.length > 0 ? (
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {optimisticSlots.map((slot, idx) => (
          <Button
            key={idx}
            variant="outline"
            disabled
            className="h-auto py-4 opacity-50 animate-pulse"
            style={{ animationDelay: `${idx * 20}ms` }}
          >
            {format(parseISO(slot.start), 'h:mm a')}
          </Button>
        ))}
      </div>
    ) : availableSlots.length === 0 ? (
      <div className="py-12 px-4">
        <div className="max-w-md mx-auto rounded-2xl border border-border bg-surface p-8 text-center">
          <div className="inline-flex p-4 rounded-full bg-muted mb-4">
            <AlertCircle className="h-8 w-8 text-foreground-secondary" />
          </div>
          <h3 className="font-display text-2xl font-semibold text-foreground mb-3">
            Fully Booked
          </h3>
          <p className="text-foreground-secondary mb-6">
            All time slots for this date are taken. Please select a different date.
          </p>
          <Button
            variant="outline"
            onClick={handleBackToDateSelection}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Choose Another Date
          </Button>
        </div>
      </div>
    ) : (
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {availableSlots.map((slot, idx) => (
          <button
            key={idx}
            onClick={() => handleSelectSlot(slot)}
            className="group relative h-auto py-4 px-3 rounded-xl border-2 border-border bg-surface text-sm font-semibold transition-all duration-200 hover:border-primary hover:bg-primary hover:text-primary-foreground hover:shadow-lg hover:shadow-primary/20 hover:scale-105"
            style={{ animationDelay: `${idx * 20}ms` }}
          >
            {format(parseISO(slot.start), 'h:mm a')}
          </button>
        ))}
      </div>
    )}
  </>
)}
```

**Success State with Celebration (Replace Lines 722-794):**
```tsx
{/* Step 4: Enhanced Confirmation */}
{step === 4 && confirmationData && (
  <div className="space-y-6">
    <Card className="border-success/20 bg-gradient-to-br from-success/5 via-background to-background overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-success/10 to-transparent opacity-50" />

      <CardHeader className="relative">
        <div className="flex flex-col items-center text-center">
          {/* Animated success icon */}
          <div className="relative mb-6">
            <div className="absolute inset-0 animate-ping">
              <div className="w-20 h-20 rounded-full bg-success/20" />
            </div>
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-success to-success/70 flex items-center justify-center shadow-lg shadow-success/30">
              <Check className="h-10 w-10 text-white animate-bounce" />
            </div>
          </div>

          <CardTitle className="font-display text-3xl font-semibold mb-3">
            You're All Set!
          </CardTitle>
          <CardDescription className="text-lg">
            Your appointment has been confirmed. We've sent the details to your email.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-6">
        {/* Appointment details card */}
        <div className="rounded-xl border border-border bg-surface p-6 space-y-4">
          <div className="flex items-start gap-4 pb-4 border-b border-border">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-white font-bold text-lg">
              {confirmationData.visitorName.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-foreground mb-1">
                {confirmationData.visitorName}
              </h3>
              <p className="text-sm text-foreground-secondary">
                {confirmationData.visitorEmail}
              </p>
            </div>
          </div>

          <div className="grid gap-3">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-foreground-secondary font-medium">Service</span>
              <span className="font-semibold text-foreground">
                {confirmationData.appointmentType.name}
              </span>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-foreground-secondary font-medium">Date</span>
              <span className="font-semibold text-foreground">
                {format(parseISO(confirmationData.startTime), 'EEEE, MMMM d, yyyy')}
              </span>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-foreground-secondary font-medium">Time</span>
              <span className="font-semibold text-foreground">
                {format(parseISO(confirmationData.startTime), 'h:mm a')} - {format(parseISO(confirmationData.endTime), 'h:mm a')}
              </span>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-foreground-secondary font-medium">Duration</span>
              <span className="font-semibold text-foreground">
                {confirmationData.appointmentType.duration} minutes
              </span>
            </div>
          </div>
        </div>

        {/* Next steps */}
        <div className="rounded-xl bg-primary/5 border border-primary/20 p-6">
          <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            What happens next?
          </h4>
          <ul className="space-y-2 text-sm text-foreground-secondary">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">✓</span>
              <span>Calendar invitation sent to {confirmationData.visitorEmail}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">✓</span>
              <span>You'll receive a reminder 24 hours before your appointment</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">✓</span>
              <span>Need to reschedule? Use the link in your confirmation email</span>
            </li>
          </ul>
        </div>

        {/* CTA buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={() => {
              setStep(1);
              setSelectedType(null);
              setSelectedSlot(null);
              setContactInfo({ name: '', email: '', phone: '', notes: '' });
              setConfirmationData(null);
            }}
          >
            Book Another
          </Button>
          <Button
            className="flex-1 gap-2 bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/30"
            onClick={() => window.close()}
          >
            Done
            <Check className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
)}
```

---

## 5. Pricing Page Polish

### Replace the entire pricing cards section (Lines 99-312) with:

```tsx
{/* Pricing Cards with Hover Effects */}
<div className="relative">
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {/* Free Tier */}
    <Card className="relative group hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
      <CardHeader>
        <CardTitle className="font-display text-2xl">Free</CardTitle>
        <CardDescription>Perfect for testing</CardDescription>
        <div className="mt-6">
          <span className="text-5xl font-display font-bold">$0</span>
          <span className="text-foreground-secondary">/month</span>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {[
            { text: '1 appointment type', included: true },
            { text: '25 bookings/month', included: true },
            { text: 'Unlimited contact forms', included: true },
            { text: 'Basic customization', included: true },
            { text: 'AI chatbot', included: false },
          ].map((feature, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <div className={`mt-0.5 p-0.5 rounded-full ${feature.included ? 'bg-success/10' : 'bg-muted'}`}>
                {feature.included ? (
                  <Check className="h-4 w-4 text-success" />
                ) : (
                  <X className="h-4 w-4 text-foreground-tertiary" />
                )}
              </div>
              <span className={`text-sm ${feature.included ? 'text-foreground' : 'text-foreground-tertiary'}`}>
                {feature.text}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full group-hover:shadow-lg transition-all duration-300"
          variant="outline"
          onClick={() => router.push('/auth/register')}
        >
          Get Started
        </Button>
      </CardFooter>
    </Card>

    {/* Booking Tier */}
    <Card className="relative group hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-2 transition-all duration-300 border-primary/20">
      <CardHeader>
        <CardTitle className="font-display text-2xl">Booking</CardTitle>
        <CardDescription>For scheduling pros</CardDescription>
        <div className="mt-6">
          <span className="text-5xl font-display font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            ${prices.booking[interval]}
          </span>
          <span className="text-foreground-secondary">/{interval === 'month' ? 'mo' : 'yr'}</span>
          {interval === 'year' && (
            <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-success/10 text-success text-xs font-medium">
              <span>Save {savings.booking}%</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {[
            { text: 'Unlimited appointment types', highlight: true },
            { text: 'Unlimited bookings', highlight: true },
            { text: 'Unlimited contact forms', highlight: false },
            { text: 'Full customization', highlight: false },
            { text: 'Team seats ($5/mo each)', highlight: false },
          ].map((feature, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <div className="mt-0.5 p-0.5 rounded-full bg-primary/10">
                <Check className="h-4 w-4 text-primary" />
              </div>
              <span className={`text-sm ${feature.highlight ? 'font-semibold text-foreground' : 'text-foreground-secondary'}`}>
                {feature.text}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full bg-gradient-to-r from-primary to-primary/80 hover:shadow-lg hover:shadow-primary/30 group-hover:scale-105 transition-all duration-300"
          onClick={() => handleSubscribe('booking')}
          disabled={loading !== null}
        >
          {loading === 'booking' ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Loading...</>
          ) : (
            'Subscribe'
          )}
        </Button>
      </CardFooter>

      {/* Glow effect on hover */}
      <div className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 opacity-0 blur-xl group-hover:opacity-100 transition-opacity duration-300" />
    </Card>

    {/* Chatbot Tier */}
    <Card className="relative group hover:shadow-xl hover:shadow-accent/10 hover:-translate-y-2 transition-all duration-300 border-accent/20">
      <CardHeader>
        <CardTitle className="font-display text-2xl">Chatbot</CardTitle>
        <CardDescription>AI-powered engagement</CardDescription>
        <div className="mt-6">
          <span className="text-5xl font-display font-bold bg-gradient-to-r from-accent to-warning bg-clip-text text-transparent">
            ${prices.chatbot[interval]}
          </span>
          <span className="text-foreground-secondary">/{interval === 'month' ? 'mo' : 'yr'}</span>
          {interval === 'year' && (
            <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-success/10 text-success text-xs font-medium">
              <span>Save {savings.chatbot}%</span>
            </div>
          )}
          <div className="text-sm text-foreground-tertiary mt-2">+ $0.01/message</div>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {[
            { text: 'AI Chatbot with Claude', highlight: true },
            { text: 'Unlimited contact forms', highlight: false },
            { text: 'Unlimited knowledge base', highlight: false },
            { text: 'Lead qualification', highlight: false },
          ].map((feature, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <div className="mt-0.5 p-0.5 rounded-full bg-accent/10">
                <Check className="h-4 w-4 text-accent" />
              </div>
              <span className={`text-sm ${feature.highlight ? 'font-semibold text-foreground' : 'text-foreground-secondary'}`}>
                {feature.text}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full bg-gradient-to-r from-accent to-accent/80 hover:shadow-lg hover:shadow-accent/30 group-hover:scale-105 transition-all duration-300"
          onClick={() => handleSubscribe('chatbot')}
          disabled={loading !== null}
        >
          {loading === 'chatbot' ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Loading...</>
          ) : (
            'Subscribe'
          )}
        </Button>
      </CardFooter>

      <div className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-br from-accent/20 to-warning/20 opacity-0 blur-xl group-hover:opacity-100 transition-opacity duration-300" />
    </Card>

    {/* Bundle Tier - Featured */}
    <Card className="relative group hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-2 transition-all duration-300 border-2 border-primary overflow-hidden">
      {/* Animated gradient border */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] animate-shimmer opacity-0 group-hover:opacity-20 transition-opacity duration-300" />

      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-accent text-white shadow-lg z-10">
        Best Value
      </Badge>

      <CardHeader className="relative z-10">
        <CardTitle className="font-display text-2xl">Bundle</CardTitle>
        <CardDescription>Everything you need</CardDescription>
        <div className="mt-6">
          <span className="text-5xl font-display font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            ${prices.bundle[interval]}
          </span>
          <span className="text-foreground-secondary">/{interval === 'month' ? 'mo' : 'yr'}</span>
          {interval === 'year' && (
            <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-success/10 text-success text-xs font-medium">
              <span>Save {savings.bundle}%</span>
            </div>
          )}
          <div className="text-sm text-foreground-tertiary mt-2">+ $0.008/message</div>
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <ul className="space-y-4">
          {[
            { text: 'Everything in Booking', highlight: true },
            { text: 'Everything in Chatbot', highlight: true },
            { text: '20% cheaper messages', highlight: true },
            { text: 'Team collaboration', highlight: false },
            { text: 'Remove SmartWidget branding', highlight: false },
          ].map((feature, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <div className="mt-0.5 p-0.5 rounded-full bg-gradient-to-r from-primary to-accent">
                <Check className="h-4 w-4 text-white" />
              </div>
              <span className={`text-sm ${feature.highlight ? 'font-semibold text-foreground' : 'text-foreground-secondary'}`}>
                {feature.text}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="relative z-10">
        <Button
          className="w-full bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] hover:bg-[position:100%_0] hover:shadow-xl hover:shadow-primary/40 group-hover:scale-105 transition-all duration-500"
          onClick={() => handleSubscribe('bundle')}
          disabled={loading !== null}
        >
          {loading === 'bundle' ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Loading...</>
          ) : (
            <>Subscribe<ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" /></>
          )}
        </Button>
      </CardFooter>

      <div className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-br from-primary/30 via-accent/30 to-primary/30 opacity-0 blur-2xl group-hover:opacity-100 transition-opacity duration-500" />
    </Card>
  </div>
</div>
```

---

## 6. Navigation Enhancement

**Enhanced Sidebar (components/dashboard/dashboard-nav.tsx):**
```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Calendar,
  CalendarCheck,
  CalendarDays,
  FileText,
  MessageSquare,
  Settings,
  LayoutDashboard,
  Palette,
  CreditCard,
  Clock,
  BookOpen,
  ClipboardList,
  Code2,
} from 'lucide-react';

const navItems = [
  {
    title: 'Overview',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Bookings',
    href: '/dashboard/bookings',
    icon: CalendarDays,
  },
  {
    title: 'Appointment Types',
    href: '/dashboard/appointments',
    icon: Calendar,
  },
  {
    title: 'Availability',
    href: '/dashboard/availability',
    icon: Clock,
  },
  {
    title: 'Booking Form',
    href: '/dashboard/booking-form',
    icon: ClipboardList,
  },
  {
    title: 'Calendar Sync',
    href: '/dashboard/calendar',
    icon: CalendarCheck,
  },
  {
    title: 'Contact Forms',
    href: '/dashboard/forms',
    icon: FileText,
  },
  {
    title: 'AI Chatbot',
    href: '/dashboard/chatbot',
    icon: MessageSquare,
  },
  {
    title: 'Knowledge Base',
    href: '/dashboard/knowledge',
    icon: BookOpen,
  },
  {
    title: 'Widget Styling',
    href: '/dashboard/widget',
    icon: Palette,
  },
  {
    title: 'Embed Code',
    href: '/dashboard/embed',
    icon: Code2,
  },
  {
    title: 'Billing',
    href: '/dashboard/billing',
    icon: CreditCard,
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-72 border-r border-border bg-surface lg:block">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-20 items-center border-b border-border px-6">
          <Link href="/dashboard" className="flex items-center space-x-3 group">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/25 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-primary/40 group-hover:scale-110">
              <span className="text-xl font-display font-bold text-white">S</span>
            </div>
            <div>
              <span className="text-xl font-display font-bold text-foreground">SmartWidget</span>
              <p className="text-xs text-foreground-tertiary">Scheduling Platform</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group relative flex items-center space-x-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/25'
                    : 'text-foreground-secondary hover:bg-surface-elevated hover:text-foreground'
                )}
              >
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />
                )}

                <Icon className={cn(
                  "h-5 w-5 transition-transform duration-200",
                  isActive ? "text-white" : "text-foreground-tertiary group-hover:text-primary",
                  "group-hover:scale-110"
                )} />
                <span className="flex-1">{item.title}</span>

                {/* Hover effect */}
                {!isActive && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 -z-10" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-4">
          <div className="rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 p-4">
            <p className="text-xs font-medium text-foreground mb-2">Need help?</p>
            <p className="text-xs text-foreground-secondary mb-3">
              Check our docs or reach out to support
            </p>
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 text-xs font-medium text-primary hover:text-accent transition-colors"
            >
              View Documentation →
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}
```

---

## 7. Setup Checklist Polish

**Enhanced Setup Checklist (components/dashboard/setup-checklist.tsx):**

Replace the return statement (Lines 144-244) with:
```tsx
return (
  <Card className="relative border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-background to-accent/5 overflow-hidden mb-8">
    {/* Decorative background elements */}
    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl" />
    <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-accent/20 to-transparent rounded-full blur-3xl" />

    <CardHeader className="relative z-10">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 animate-ping">
              <div className="w-14 h-14 rounded-xl bg-primary/20" />
            </div>
            <div className="relative w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30">
              <Rocket className="h-7 w-7 text-white" />
            </div>
          </div>
          <div>
            <CardTitle className="font-display text-2xl font-semibold">
              Complete Your Setup
            </CardTitle>
            <CardDescription className="text-base mt-1">
              {completedCount} of {totalCount} essential tasks completed
            </CardDescription>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDismiss}
          className="h-10 w-10 rounded-lg hover:bg-background/50"
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Dismiss</span>
        </Button>
      </div>

      {/* Enhanced Progress Bar */}
      <div className="mt-6">
        <div className="relative h-3 rounded-full bg-border overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-700 ease-out shadow-lg shadow-primary/30"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">
            {progressPercentage.toFixed(0)}% complete
          </p>
          <p className="text-xs text-foreground-tertiary">
            {totalCount - completedCount} task{totalCount - completedCount !== 1 ? 's' : ''} remaining
          </p>
        </div>
      </div>
    </CardHeader>

    <CardContent className="relative z-10">
      <div className="space-y-3">
        {tasks.map((task, index) => {
          const Icon = task.icon;
          return (
            <div
              key={task.id}
              className={`group flex items-start gap-4 rounded-xl border-2 p-5 transition-all duration-300 ${
                task.completed
                  ? 'bg-success/5 border-success/30 shadow-sm'
                  : 'bg-surface border-border hover:border-primary/30 hover:shadow-md hover:shadow-primary/5'
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Status icon */}
              <div className="mt-1">
                {task.completed ? (
                  <div className="relative">
                    <div className="absolute inset-0 animate-ping">
                      <div className="w-6 h-6 rounded-full bg-success/20" />
                    </div>
                    <div className="relative w-6 h-6 rounded-full bg-success flex items-center justify-center">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-border group-hover:border-primary transition-colors duration-200" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg transition-all duration-200 ${
                    task.completed
                      ? 'bg-success/10'
                      : 'bg-primary/10 group-hover:bg-primary group-hover:scale-110'
                  }`}>
                    <Icon className={`h-4 w-4 ${
                      task.completed
                        ? 'text-success'
                        : 'text-primary group-hover:text-white'
                    } transition-colors duration-200`} />
                  </div>
                  <h3 className={`font-semibold ${
                    task.completed ? 'text-success' : 'text-foreground'
                  }`}>
                    {task.title}
                  </h3>
                </div>
                <p className="text-sm text-foreground-secondary">
                  {task.description}
                </p>
              </div>

              {/* Action button */}
              {!task.completed ? (
                <Link href={task.link}>
                  <Button
                    size="sm"
                    className="gap-2 bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/30 transition-all duration-200"
                  >
                    Setup
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              ) : (
                <Link href={task.link}>
                  <Button size="sm" variant="outline" className="gap-2">
                    View
                  </Button>
                </Link>
              )}
            </div>
          );
        })}
      </div>

      {/* Encouragement message */}
      {completedCount > 0 && completedCount < totalCount && (
        <div className="mt-6 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 p-5">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <Check className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground mb-1">
                Great progress!
              </p>
              <p className="text-sm text-foreground-secondary">
                Complete the remaining {totalCount - completedCount} task{totalCount - completedCount !== 1 ? 's' : ''} to unlock the full potential of SmartWidget.
              </p>
            </div>
          </div>
        </div>
      )}
    </CardContent>
  </Card>
);
```

---

## 8. Global Animations & Utilities

**Add to app/globals.css:**
```css
/* Enhanced animations */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}

@keyframes pulse-glow {
  0%, 100% {
    opacity: 0.5;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
}

/* Utility classes */
.animate-fade-in {
  animation: fadeIn 0.5s ease-out forwards;
}

.animate-fade-in-up {
  animation: fadeInUp 0.6s ease-out forwards;
}

.animate-slide-in-right {
  animation: slideInRight 0.5s ease-out forwards;
}

.animate-shimmer {
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.1) 50%,
    transparent 100%
  );
  background-size: 1000px 100%;
  animation: shimmer 2s infinite;
}

.animate-pulse-glow {
  animation: pulse-glow 2s ease-in-out infinite;
}

/* Smooth transitions for all interactive elements */
button, a, [role="button"] {
  @apply transition-all duration-200;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  @apply bg-background;
}

::-webkit-scrollbar-thumb {
  @apply bg-border rounded-full hover:bg-border-strong;
}

/* Focus states */
*:focus-visible {
  @apply outline-none ring-2 ring-primary ring-offset-2 ring-offset-background;
}

/* Gradient mesh utility */
.gradient-mesh {
  background:
    radial-gradient(at 0% 0%, hsl(var(--primary)) 0px, transparent 50%),
    radial-gradient(at 100% 0%, hsl(var(--accent)) 0px, transparent 50%),
    radial-gradient(at 100% 100%, hsl(var(--success)) 0px, transparent 50%),
    radial-gradient(at 0% 100%, hsl(var(--primary)) 0px, transparent 50%);
  opacity: 0.15;
  filter: blur(80px);
}

/* Noise texture overlay */
.noise-texture::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
  opacity: 0.03;
  pointer-events: none;
}

/* Glass morphism utility */
.glass {
  @apply bg-background/50 backdrop-blur-xl border border-border/50;
}

/* Card hover glow effect */
.card-glow {
  @apply relative;
}

.card-glow::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: inherit;
  background: linear-gradient(45deg, hsl(var(--primary)), hsl(var(--accent)));
  opacity: 0;
  transition: opacity 0.3s;
  z-index: -1;
  filter: blur(10px);
}

.card-glow:hover::before {
  opacity: 0.3;
}
```

---

## 9. Additional Recommendations

### A. Replace alert() with toast notifications
```tsx
// Throughout the app, replace:
alert('Copied to clipboard!');

// With:
import { toast } from 'sonner';
toast.success('Copied to clipboard!', {
  description: 'You can now share this link',
});
```

### B. Add skeleton loading states
```tsx
// Instead of <div>Loading...</div>, use:
<div className="space-y-4">
  <div className="h-24 rounded-xl bg-muted animate-pulse" />
  <div className="h-24 rounded-xl bg-muted animate-pulse" />
  <div className="h-24 rounded-xl bg-muted animate-pulse" />
</div>
```

### C. Page transitions
```tsx
// app/template.tsx (create new file)
'use client';

import { motion } from 'framer-motion';

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {children}
    </motion.div>
  );
}
```

---

## Summary: Key Transformations

1. **Typography**: Instrument Serif + Space Grotesk → Distinctive editorial feel
2. **Colors**: Rich jewel tones with gradients → Professional & memorable
3. **Dashboard**: Gradient hero, animated stats, enhanced bookings → Polished
4. **Booking Flow**: Conversational steps, smooth transitions, celebration → Delightful
5. **Pricing**: Hover effects, glow on cards, visual hierarchy → Compelling
6. **Navigation**: Active indicators, hover animations, better branding → Professional
7. **Setup Checklist**: Progress visualization, encouraging copy → Engaging
8. **Micro-interactions**: Smooth hover states, scale effects, shadows → Polished
9. **Loading States**: Skeleton screens, spinners, animations → Modern
10. **Notifications**: Toast messages instead of alerts → User-friendly

These changes will transform SmartWidget from a generic SaaS template into a distinctive, memorable product that feels intentionally designed. The improvements maintain functionality while adding personality and polish throughout the user experience.
