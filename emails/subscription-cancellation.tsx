import { Section, Text, Heading, Button, Link } from '@react-email/components';
import { EmailLayout } from './components/email-layout';

interface SubscriptionCancellationProps {
  userName: string;
  tierName: string;
  accessEndDate: string;
  reactivateUrl: string;
}

export function SubscriptionCancellation({
  userName,
  tierName,
  accessEndDate,
  reactivateUrl,
}: SubscriptionCancellationProps) {
  return (
    <EmailLayout preview={`Your ${tierName} subscription has been canceled`}>
      <Heading style={h1}>Subscription Canceled</Heading>

      <Text style={text}>Hi {userName},</Text>

      <Text style={text}>
        We're confirming that your Kentroi subscription has been canceled. You'll
        continue to have full access to your plan until the end of your current
        billing period.
      </Text>

      <Section style={detailsBox}>
        <Text style={detailLabel}>Plan</Text>
        <Text style={detailValue}>{tierName}</Text>
        <Text style={detailLabel}>Access Until</Text>
        <Text style={detailValue}>{accessEndDate}</Text>
      </Section>

      <Text style={text}>
        Changed your mind? You can reactivate your subscription anytime before{' '}
        {accessEndDate} to keep your plan without interruption.
      </Text>

      <Section style={buttonSection}>
        <Button href={reactivateUrl} style={button}>
          Reactivate Subscription
        </Button>
      </Section>

      <Text style={text}>
        If you have any questions, simply reply to this email. We're here to
        help!
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

const detailsBox = {
  backgroundColor: '#f9fafb',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
  border: '1px solid #e5e7eb',
};

const detailLabel = {
  color: '#6b7280',
  fontSize: '12px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0 0 4px 0',
};

const detailValue = {
  color: '#1f2937',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 16px 0',
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
