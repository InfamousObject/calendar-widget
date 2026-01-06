import type { Metadata } from "next";
import { Space_Grotesk, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ClerkProvider } from '@clerk/nextjs';
import { ErrorBoundary } from '@/components/error-boundary';

const sansFont = Space_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const displayFont = Instrument_Serif({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SmartWidget - Smart Scheduling & AI Chatbot Platform",
  description: "Powerful appointment scheduling, contact forms, and AI chatbot in one embeddable widget",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Provide fallback for build time (when env vars aren't available)
  // At runtime, the actual key must be set for Clerk to work
  const clerkPubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_test_dummy_key_for_build';

  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <html lang="en">
        <body
          className={`${sansFont.variable} ${displayFont.variable} antialiased`}
        >
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
