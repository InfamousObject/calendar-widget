import { Section, Text, Heading, Button, Link } from '@react-email/components';
import { EmailLayout } from './components/email-layout';

interface ReengagementOfferProps {
  userName: string;
  reason: string;
  discountCode: string;
  discountPercent: number;
  discountDurationMonths: number;
  reactivateUrl: string;
}

const REASON_MESSAGES: Record<string, string> = {
  too_expensive: "We noticed budget was a concern, so we'd like to offer you a special discount.",
  not_using: "Life gets busy! But your booking system is still here, ready to help you save time.",
  missing_features: "We're always improving. Come back and see what's new!",
  switched: "Sometimes it takes trying something else to appreciate what works. We'd love to welcome you back.",
  other: "Whatever your reason for leaving, we'd love another chance to serve you.",
};

export function ReengagementOffer({
  userName,
  reason,
  discountCode,
  discountPercent,
  discountDurationMonths,
  reactivateUrl,
}: ReengagementOfferProps) {
  const reasonMessage = REASON_MESSAGES[reason] || REASON_MESSAGES.other;

  return (
    <EmailLayout preview={`Come back to Kentroi - ${discountPercent}% off for ${discountDurationMonths} months`}>
      <Heading style={h1}>We'd Love to Have You Back</Heading>

      <Text style={text}>Hi {userName},</Text>

      <Text style={text}>
        We noticed you recently canceled your Kentroi subscription.{' '}
        {reasonMessage}
      </Text>

      <Section style={offerBox}>
        <Text style={offerTitle}>Special Offer Just for You</Text>
        <Text style={offerValue}>
          {discountPercent}% OFF for {discountDurationMonths} months
        </Text>
        <Text style={offerCode}>
          Use code: <strong>{discountCode}</strong>
        </Text>
      </Section>

      <Section style={buttonSection}>
        <Button href={reactivateUrl} style={button}>
          Reactivate My Account
        </Button>
      </Section>

      <Text style={text}>
        This offer is valid for the next 7 days. After that, regular pricing will apply.
      </Text>

      <Text style={text}>
        If you have any questions or feedback, simply reply to this email.
        We're always here to help!
      </Text>

      <Text style={signature}>
        Best regards,
        <br />
        The Kentroi Team
      </Text>

      <Text style={footer}>
        If you no longer wish to receive these emails,{' '}
        <Link href={`${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe`} style={footerLink}>
          click here to unsubscribe
        </Link>.
      </Text>
    </EmailLayout>
  );
}

// Styles
const h1 = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '32px',
  margin: '16px 0',
};

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
};

const offerBox = {
  backgroundColor: '#f0fdf4',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
  textAlign: 'center' as const,
  border: '1px solid #86efac',
};

const offerTitle = {
  color: '#166534',
  fontSize: '14px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0 0 8px 0',
};

const offerValue = {
  color: '#15803d',
  fontSize: '28px',
  fontWeight: '700',
  margin: '0 0 12px 0',
};

const offerCode = {
  color: '#374151',
  fontSize: '16px',
  margin: '0',
  padding: '8px 16px',
  backgroundColor: '#ffffff',
  borderRadius: '6px',
  display: 'inline-block',
};

const buttonSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#3b82f6',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  padding: '14px 28px',
  textDecoration: 'none',
};

const signature = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '32px 0 16px 0',
};

const footer = {
  color: '#9ca3af',
  fontSize: '12px',
  lineHeight: '18px',
  margin: '24px 0 0 0',
  paddingTop: '24px',
  borderTop: '1px solid #e5e7eb',
};

const footerLink = {
  color: '#6b7280',
  textDecoration: 'underline',
};
