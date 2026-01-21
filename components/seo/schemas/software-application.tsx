export function SoftwareApplicationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Kentroi',
    description:
      'All-in-one scheduling widget with appointment booking, contact forms, and AI chatbot. One embed, endless possibilities.',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: 'https://www.kentroi.com',
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'USD',
      lowPrice: '0',
      highPrice: '119',
      offerCount: '4',
      offers: [
        {
          '@type': 'Offer',
          name: 'Free',
          price: '0',
          priceCurrency: 'USD',
          description: 'Contact forms free forever with unlimited forms and submissions',
        },
        {
          '@type': 'Offer',
          name: 'Booking',
          price: '29',
          priceCurrency: 'USD',
          priceSpecification: {
            '@type': 'UnitPriceSpecification',
            price: '29',
            priceCurrency: 'USD',
            billingDuration: 'P1M',
          },
          description: 'Appointment scheduling with Google Calendar sync',
        },
        {
          '@type': 'Offer',
          name: 'Chatbot',
          price: '89',
          priceCurrency: 'USD',
          priceSpecification: {
            '@type': 'UnitPriceSpecification',
            price: '89',
            priceCurrency: 'USD',
            billingDuration: 'P1M',
          },
          description: 'AI-powered chatbot with knowledge base',
        },
        {
          '@type': 'Offer',
          name: 'Bundle',
          price: '119',
          priceCurrency: 'USD',
          priceSpecification: {
            '@type': 'UnitPriceSpecification',
            price: '119',
            priceCurrency: 'USD',
            billingDuration: 'P1M',
          },
          description: 'Complete solution with scheduling, forms, and AI chatbot',
        },
      ],
    },
    featureList: [
      'Appointment Scheduling',
      'Google Calendar Integration',
      'Contact Form Builder',
      'AI-Powered Chatbot',
      'Lead Qualification',
      'Email Notifications',
      'Embeddable Widget',
      'Mobile Responsive',
      'Custom Branding',
      'Analytics Dashboard',
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
