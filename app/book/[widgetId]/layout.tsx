import { Metadata } from 'next';

// Force dynamic rendering so useSearchParams() works for prefilled booking URLs
export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ widgetId: string }>;
}): Promise<Metadata> {
  const { widgetId } = await params;
  return {
    title: 'Book an Appointment',
    description:
      'Schedule an appointment online. Choose a time that works for you and book instantly with Kentroi.',
    alternates: {
      canonical: `https://www.kentroi.com/book/${widgetId}`,
    },
    openGraph: {
      title: 'Book an Appointment | Kentroi',
      description:
        'Schedule an appointment online. Choose a time that works for you and book instantly.',
      url: `https://www.kentroi.com/book/${widgetId}`,
    },
  };
}

export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
