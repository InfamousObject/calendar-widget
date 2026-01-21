import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing - Free Plan & Premium Features',
  description:
    'Kentroi pricing: Contact forms free forever. Booking from $29/mo, AI Chatbot from $89/mo, or Bundle everything for $119/mo. No credit card required to start.',
  keywords: [
    'kentroi pricing',
    'scheduling software pricing',
    'calendly alternative pricing',
    'free scheduling software',
    'appointment booking cost',
    'ai chatbot pricing',
  ],
  alternates: {
    canonical: 'https://www.kentroi.com/pricing',
  },
  openGraph: {
    title: 'Kentroi Pricing - Free Plan Available',
    description:
      'Contact forms free forever. Booking from $29/mo, AI Chatbot from $89/mo. Start free, no credit card required.',
    url: 'https://www.kentroi.com/pricing',
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
