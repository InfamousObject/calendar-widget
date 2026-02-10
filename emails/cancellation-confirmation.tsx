import { Section, Text, Heading } from '@react-email/components';
import { EmailLayout } from './components/email-layout';
import { formatInTimeZone } from 'date-fns-tz';

interface CancellationConfirmationProps {
  visitorName: string;
  appointmentTypeName: string;
  startTime: Date;
  timezone: string;
  ownerName?: string;
  businessName?: string;
}

function getProviderDisplay(ownerName?: string, businessName?: string): string {
  if (ownerName && businessName) return `${ownerName} at ${businessName}`;
  if (ownerName) return ownerName;
  if (businessName) return businessName;
  return 'your provider';
}

export function CancellationConfirmation({
  visitorName,
  appointmentTypeName,
  startTime,
  timezone,
  ownerName,
  businessName,
}: CancellationConfirmationProps) {
  const formattedDate = formatInTimeZone(startTime, timezone, 'EEEE, MMMM d, yyyy');
  const formattedTime = formatInTimeZone(startTime, timezone, 'h:mm a');

  return (
    <EmailLayout preview={`Your ${appointmentTypeName} appointment has been cancelled`}>
      <Heading style={h1}>Appointment Cancelled</Heading>

      <Text style={text}>Hi {visitorName},</Text>

      <Text style={text}>
        Your appointment with <strong>{getProviderDisplay(ownerName, businessName)}</strong> has been successfully cancelled.
      </Text>

      <Section style={detailsBox}>
        <Text style={detailLabel}>Cancelled Appointment:</Text>
        <Text style={detailValue}>{appointmentTypeName}</Text>

        <Text style={detailLabel}>Was Scheduled For:</Text>
        <Text style={detailValue}>
          {formattedDate}
          <br />
          {formattedTime} ({timezone})
        </Text>
      </Section>

      <Text style={text}>
        If you'd like to reschedule, please visit our booking page to select a new time.
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
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
};

const detailLabel = {
  color: '#6b7280',
  fontSize: '12px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  margin: '0 0 4px 0',
};

const detailValue = {
  color: '#1f2937',
  fontSize: '16px',
  margin: '0 0 16px 0',
};
