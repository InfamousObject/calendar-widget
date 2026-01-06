import { Section, Text, Heading } from '@react-email/components';
import { EmailLayout } from './components/email-layout';
import { formatInTimeZone } from 'date-fns-tz';

interface BookingNotificationProps {
  visitorName: string;
  visitorEmail: string;
  appointmentTypeName: string;
  startTime: Date;
  timezone: string;
  notes?: string;
}

export function BookingNotification({
  visitorName,
  visitorEmail,
  appointmentTypeName,
  startTime,
  timezone,
  notes,
}: BookingNotificationProps) {
  const formattedDate = formatInTimeZone(startTime, timezone, 'EEEE, MMMM d, yyyy');
  const formattedTime = formatInTimeZone(startTime, timezone, 'h:mm a');

  return (
    <EmailLayout preview={`New booking: ${appointmentTypeName} with ${visitorName}`}>
      <Heading style={h1}>New Appointment Booked</Heading>

      <Text style={text}>
        You have a new appointment scheduled.
      </Text>

      <Section style={detailsBox}>
        <Text style={detailLabel}>Customer:</Text>
        <Text style={detailValue}>
          {visitorName}
          <br />
          {visitorEmail}
        </Text>

        <Text style={detailLabel}>Appointment Type:</Text>
        <Text style={detailValue}>{appointmentTypeName}</Text>

        <Text style={detailLabel}>Date & Time:</Text>
        <Text style={detailValue}>
          {formattedDate}
          <br />
          {formattedTime} ({timezone})
        </Text>

        {notes && (
          <>
            <Text style={detailLabel}>Notes:</Text>
            <Text style={detailValue}>{notes}</Text>
          </>
        )}
      </Section>
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
