import { Button, Section, Text, Heading } from '@react-email/components';
import { EmailLayout } from './components/email-layout';
import { format } from 'date-fns';

interface PaymentFailureAlertProps {
  userName: string;
  invoiceAmount: number;
  dueDate: Date;
  invoiceUrl: string;
}

export function PaymentFailureAlert({
  userName,
  invoiceAmount,
  dueDate,
  invoiceUrl,
}: PaymentFailureAlertProps) {
  const formattedDueDate = format(dueDate, 'PPP'); // e.g., "April 29, 2023"
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(invoiceAmount);

  return (
    <EmailLayout preview="Payment Failed - Action Required">
      <Heading style={h1}>Payment Failed</Heading>

      <Text style={text}>Hi {userName},</Text>

      <Text style={text}>
        We were unable to process your recent payment. Your subscription may be interrupted if this issue is not resolved.
      </Text>

      <Section style={detailsBox}>
        <Text style={detailLabel}>Amount Due:</Text>
        <Text style={detailValue}>{formattedAmount}</Text>

        <Text style={detailLabel}>Due Date:</Text>
        <Text style={detailValue}>{formattedDueDate}</Text>
      </Section>

      <Text style={text}>
        Please update your payment method to avoid any service interruptions.
      </Text>

      <Button style={button} href={invoiceUrl}>
        Update Payment Method
      </Button>

      <Text style={smallText}>
        If you believe this is an error or have any questions, please contact support.
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
  backgroundColor: '#fef2f2',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
  borderLeft: '4px solid #ef4444',
};

const detailLabel = {
  color: '#991b1b',
  fontSize: '12px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  margin: '0 0 4px 0',
};

const detailValue = {
  color: '#1f2937',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 16px 0',
};

const button = {
  backgroundColor: '#ef4444',
  borderRadius: '6px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: '600',
  lineHeight: '48px',
  textAlign: 'center' as const,
  textDecoration: 'none',
  padding: '0 32px',
  margin: '16px 0',
};

const smallText = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '16px 0',
};
