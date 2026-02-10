import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In',
  description:
    'Sign in to your Kentroi account to manage your scheduling widgets, bookings, and chatbot.',
  alternates: {
    canonical: 'https://www.kentroi.com/auth/login',
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
