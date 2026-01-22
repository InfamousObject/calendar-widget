import { Button, Section, Text, Heading, Link } from '@react-email/components';
import { EmailLayout } from './components/email-layout';
import { formatInTimeZone } from 'date-fns-tz';

interface BookingConfirmationProps {
  visitorName: string;
  appointmentTypeName: string;
  startTime: Date;
  endTime: Date;
  timezone: string;
  cancelUrl: string;
  businessName?: string;
  meetingLink?: string;
  meetingProvider?: string;
}

export function BookingConfirmation({
  visitorName,
  appointmentTypeName,
  startTime,
  endTime,
  timezone,
  cancelUrl,
  businessName = 'Kentroi',
  meetingLink,
  meetingProvider,
}: BookingConfirmationProps) {
  const formattedDate = formatInTimeZone(startTime, timezone, 'EEEE, MMMM d, yyyy');
  const formattedTime = formatInTimeZone(startTime, timezone, 'h:mm a');
  const formattedEndTime = formatInTimeZone(endTime, timezone, 'h:mm a');

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
    <EmailLayout preview={`Your ${appointmentTypeName} appointment is confirmed`}>
      <Heading style={h1}>Appointment Confirmed!</Heading>

      <Text style={text}>Hi {visitorName},</Text>

      <Text style={text}>
        Your appointment with {businessName} has been confirmed. We look forward to seeing you!
      </Text>

      <Section style={detailsBox}>
        <Text style={detailLabel}>Appointment Type:</Text>
        <Text style={detailValue}>{appointmentTypeName}</Text>

        <Text style={detailLabel}>Date & Time:</Text>
        <Text style={detailValue}>
          {formattedDate}
          <br />
          {formattedTime} - {formattedEndTime} ({timezone})
        </Text>

        {meetingLink && (
          <>
            <Text style={detailLabel}>{getMeetingProviderName(meetingProvider)}:</Text>
            <Text style={detailValue}>
              <Link href={meetingLink} style={meetingLinkStyle}>
                Join Meeting
              </Link>
            </Text>
          </>
        )}
      </Section>

      {meetingLink && (
        <Button style={joinButton} href={meetingLink}>
          Join {getMeetingProviderName(meetingProvider)}
        </Button>
      )}

      <Button style={button} href={cancelUrl}>
        Cancel Appointment
      </Button>

      <Text style={smallText}>
        Need to make changes? Use the link above to cancel, and you can book a new time.
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

const button = {
  backgroundColor: '#4F46E5',
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

const meetingLinkStyle = {
  color: '#4F46E5',
  textDecoration: 'underline',
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
  margin: '16px 8px 16px 0',
};
