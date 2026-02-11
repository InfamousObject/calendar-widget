import { Section, Text, Heading, Button } from '@react-email/components';
import { EmailLayout } from './components/email-layout';

interface WelcomeProps {
  toName: string;
  toEmail: string;
}

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.kentroi.com';

export function Welcome({ toName }: WelcomeProps) {
  return (
    <EmailLayout preview="Welcome to Kentroi! Get started with your embeddable widgets.">
      <Heading style={h1}>Welcome to Kentroi!</Heading>

      <Text style={text}>
        Hi {toName},
      </Text>

      <Text style={text}>
        Thanks for signing up! Kentroi gives you everything you need to engage
        with your customers — all embeddable on your website with a single
        snippet.
      </Text>

      <Section style={featuresBox}>
        <Text style={featureLabel}>What you can do:</Text>

        <Text style={featureItem}>
          <strong>Booking Widget</strong> — Let customers schedule appointments
          directly from your site, synced with your Google Calendar.
        </Text>

        <Text style={featureItem}>
          <strong>Chatbot</strong> — Add an AI-powered chatbot to answer
          questions and engage visitors in real time.
        </Text>

        <Text style={featureItem}>
          <strong>Contact Forms</strong> — Build custom forms to capture leads
          and inquiries, with instant email notifications.
        </Text>
      </Section>

      <Section style={ctaSection}>
        <Button style={ctaButton} href={`${appUrl}/dashboard`}>
          Go to Dashboard
        </Button>
      </Section>

      <Text style={smallText}>
        Need help getting started? Check out our{' '}
        <a href={`${appUrl}/docs`} style={linkStyle}>documentation</a> for
        step-by-step guides.
      </Text>
    </EmailLayout>
  );
}

// Styles
const h1 = {
  color: '#1f2937',
  fontSize: '28px',
  fontWeight: '600',
  lineHeight: '36px',
  margin: '24px 0 16px 0',
  textAlign: 'center' as const,
};

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
};

const featuresBox = {
  backgroundColor: '#f9fafb',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
  border: '1px solid #e5e7eb',
};

const featureLabel = {
  color: '#6b7280',
  fontSize: '12px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0 0 12px 0',
};

const featureItem = {
  color: '#4b5563',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0 0 12px 0',
};

const ctaSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const ctaButton = {
  backgroundColor: '#3b82f6',
  borderRadius: '8px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: '600',
  lineHeight: '52px',
  textAlign: 'center' as const,
  textDecoration: 'none',
  padding: '0 40px',
};

const smallText = {
  color: '#6b7280',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '12px 0',
  textAlign: 'center' as const,
};

const linkStyle = {
  color: '#3b82f6',
  textDecoration: 'underline',
};

export default Welcome;
