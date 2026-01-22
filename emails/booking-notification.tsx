import { Section, Text, Heading, Link, Button } from '@react-email/components';
import { EmailLayout } from './components/email-layout';
import { formatInTimeZone } from 'date-fns-tz';

interface BookingNotificationProps {
  visitorName: string;
  visitorEmail: string;
  appointmentTypeName: string;
  startTime: Date;
  timezone: string;
  notes?: string;
  meetingLink?: string;
  meetingProvider?: string;
}

export function BookingNotification({
  visitorName,
  visitorEmail,
  appointmentTypeName,
  startTime,
  timezone,
  notes,
  meetingLink,
  meetingProvider,
}: BookingNotificationProps) {
  const formattedDate = formatInTimeZone(startTime, timezone, 'EEEE, MMMM d, yyyy');
  const formattedTime = formatInTimeZone(startTime, timezone, 'h:mm a');

  // Format meeting provider display name
  const getMeetingProviderName = (provider?: string) => {
    switch (provider) {
      case 'google_meet':
        return 'Google Meet';
      case 'zoom':
        return 'Zoom';
      default:
        return 'Video Call';
    }
  };

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

        {meetingLink && (
          <>
            <Text style={detailLabel}>{getMeetingProviderName(meetingProvider)}:</Text>
            <Text style={detailValue}>
              <Link href={meetingLink} style={meetingLinkStyle}>
                {meetingLink}
              </Link>
            </Text>
          </>
        )}

        {notes && (
          <>
            <Text style={detailLabel}>Notes:</Text>
            <Text style={detailValue}>{notes}</Text>
          </>
        )}
      </Section>

      {meetingLink && (
        <Button style={joinButton} href={meetingLink}>
          Join {getMeetingProviderName(meetingProvider)}
        </Button>
      )}
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

const meetingLinkStyle = {
  color: '#4F46E5',
  textDecoration: 'underline',
  wordBreak: 'break-all' as const,
};

const joinButton = {
  backgroundColor: '#10b981', // Green for video call
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
