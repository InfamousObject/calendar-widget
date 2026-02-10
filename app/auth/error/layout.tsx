import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Authentication Error',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ErrorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
