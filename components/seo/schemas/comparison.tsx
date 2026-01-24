interface ComparisonSchemaProps {
  mainProduct: string;
  comparedProduct: string;
  mainProductUrl: string;
  description?: string;
}

export function ComparisonSchema({
  mainProduct,
  comparedProduct,
  mainProductUrl,
  description,
}: ComparisonSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${mainProduct} vs ${comparedProduct}: Complete Comparison`,
    description:
      description ||
      `Detailed comparison of ${mainProduct} and ${comparedProduct} for appointment scheduling, pricing, features, and customer support.`,
    author: {
      '@type': 'Organization',
      name: 'Kentroi',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Kentroi',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.kentroi.com/kentroi-logomark.png',
      },
    },
    mainEntityOfPage: mainProductUrl,
    datePublished: '2025-01-21',
    dateModified: new Date().toISOString().split('T')[0],
    itemReviewed: [
      {
        '@type': 'SoftwareApplication',
        name: mainProduct,
        applicationCategory: 'BusinessApplication',
      },
      {
        '@type': 'SoftwareApplication',
        name: comparedProduct,
        applicationCategory: 'BusinessApplication',
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
