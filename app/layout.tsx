import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ClerkProvider } from '@clerk/nextjs';
import { ErrorBoundary } from '@/components/error-boundary';
import { ThemeProvider } from '@/components/theme-provider';
import { OrganizationSchema, SoftwareApplicationSchema } from '@/components/seo/schemas';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics';
import { RouteChangeTracker } from '@/components/analytics/RouteChangeTracker';
import { CookieConsent } from '@/components/analytics/CookieConsent';

const sansFont = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Kentroi - All-in-One Scheduling Widget with AI Chatbot",
    template: "%s | Kentroi",
  },
  description: "Free scheduling widget with appointment booking, contact forms, and AI chatbot. One embed, endless possibilities. Calendly alternative with better support and more features.",
  keywords: [
    "scheduling widget",
    "appointment booking",
    "calendly alternative",
    "contact form builder",
    "ai chatbot",
    "embeddable widget",
    "booking software",
    "scheduling software",
    "appointment scheduling",
    "google calendar integration",
  ],
  metadataBase: new URL('https://www.kentroi.com'),
  alternates: {
    canonical: 'https://www.kentroi.com',
  },
  openGraph: {
    title: "Kentroi - All-in-One Scheduling Widget",
    description: "Free scheduling widget with appointment booking, contact forms, and AI chatbot. One embed, endless possibilities.",
    url: 'https://www.kentroi.com',
    siteName: "Kentroi",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Kentroi - Smart Scheduling & AI Chat Widget",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kentroi - All-in-One Scheduling Widget",
    description: "Free scheduling widget with appointment booking, contact forms, and AI chatbot. One embed, endless possibilities.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Provide fallback for build time (when env vars aren't available)
  // At runtime, the actual key must be set for Clerk to work
  // Using a valid-looking format that passes Clerk's validation
  const clerkPubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_test_Y2xlcmsuZXhhbXBsZS5jb20kDUMMY0tEWVlfRk9SX0JVSUxE';

  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <html lang="en">
        <head>
          {/* Satoshi font from Fontshare for headlines */}
          <link href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&display=swap" rel="stylesheet" />
          {/* PWA Manifest and Apple Touch Icon */}
          <link rel="manifest" href="/manifest.json" />
          <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
          <meta name="theme-color" content="#4F46E5" />
          {/* Structured Data / Schema.org */}
          <OrganizationSchema />
          <SoftwareApplicationSchema />
        </head>
        <body
          className={`${sansFont.variable} antialiased`}
        >
          <ThemeProvider>
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
            <Toaster />
            <Analytics />
            <SpeedInsights />
            <GoogleAnalytics />
            <RouteChangeTracker />
            <CookieConsent />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
