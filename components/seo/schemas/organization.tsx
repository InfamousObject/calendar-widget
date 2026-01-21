export function OrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Kentroi',
    url: 'https://www.kentroi.com',
    logo: 'https://www.kentroi.com/kentroi-logomark.png',
    description:
      'All-in-one embeddable website widget that combines appointment scheduling, contact forms, and AI-powered chatbot functionality into a single solution for businesses.',
    foundingDate: '2025',
    sameAs: [
      // Add social links when available
      // 'https://twitter.com/kentroi',
      // 'https://linkedin.com/company/kentroi',
      // 'https://github.com/kentroi',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: 'support@kentroi.com',
      availableLanguage: ['English'],
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
