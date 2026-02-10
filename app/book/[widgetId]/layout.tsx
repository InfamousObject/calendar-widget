import { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ widgetId: string }>;
}): Promise<Metadata> {
  const { widgetId } = await params;
  return {
    alternates: {
      canonical: `https://www.kentroi.com/book/${widgetId}`,
    },
  };
}

export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
