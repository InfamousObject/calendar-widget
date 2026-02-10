import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Widget Demo',
  description:
    'Live demo of a Kentroi scheduling widget. See booking, forms, and AI chatbot in action.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
