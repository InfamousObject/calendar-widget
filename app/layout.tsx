import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ClerkProvider } from '@clerk/nextjs';
import { ErrorBoundary } from '@/components/error-boundary';
import { ThemeProvider } from '@/components/theme-provider';

const sansFont = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kentroi - Smart Scheduling & AI Chat Widget",
  description: "One embed, endless possibilities. Appointment scheduling, contact forms, and AI chat in a single embeddable widget.",
  metadataBase: new URL('https://kentroi.com'),
  openGraph: {
    title: "Kentroi",
    description: "One embed, endless possibilities",
    images: ["/og-image.png"],
    siteName: "Kentroi",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kentroi",
    description: "One embed, endless possibilities",
    images: ["/og-image.png"],
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
        </head>
        <body
          className={`${sansFont.variable} antialiased`}
        >
          <ThemeProvider>
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
            <Toaster />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
