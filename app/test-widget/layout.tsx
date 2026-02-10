import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Test Widget',
  description: 'Preview and test your Kentroi widget configuration.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function TestWidgetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
