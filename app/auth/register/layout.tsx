import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Account',
  description:
    'Create your free Kentroi account. Get started with scheduling widgets, contact forms, and AI chatbot in minutes.',
  alternates: {
    canonical: 'https://www.kentroi.com/auth/register',
  },
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
