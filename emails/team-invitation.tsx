import { Section, Text, Heading, Button } from '@react-email/components';
import { EmailLayout } from './components/email-layout';
import { format } from 'date-fns';

interface TeamInvitationProps {
  toName: string;
  inviterName: string;
  accountName: string;
  role: 'admin' | 'member';
  invitationUrl: string;
  expiresAt: Date;
}

export function TeamInvitation({
  toName,
  inviterName,
  accountName,
  role,
  invitationUrl,
  expiresAt,
}: TeamInvitationProps) {
  const roleDescription = role === 'admin'
    ? 'As an admin, you will be able to manage appointments, customize the widget, and invite other team members.'
    : 'As a team member, you will be able to view and create appointments, and connect your calendar for availability.';

  const expiresFormatted = format(expiresAt, 'MMMM d, yyyy');

  return (
    <EmailLayout preview={`${inviterName} has invited you to join ${accountName} on Kentroi`}>
      <Heading style={h1}>You're Invited!</Heading>

      <Text style={text}>
        Hi {toName},
      </Text>

      <Text style={text}>
        <strong>{inviterName}</strong> has invited you to join <strong>{accountName}</strong> on Kentroi
        as a team <strong>{role}</strong>.
      </Text>

      <Section style={detailsBox}>
        <Text style={detailLabel}>Your Role:</Text>
        <Text style={roleText}>
          {role === 'admin' ? '👑 Admin' : '👤 Member'}
        </Text>

        <Text style={roleDescription1}>{roleDescription}</Text>
      </Section>

      <Section style={ctaSection}>
        <Button style={acceptButton} href={invitationUrl}>
          Accept Invitation
        </Button>
      </Section>

      <Text style={smallText}>
        This invitation will expire on <strong>{expiresFormatted}</strong>.
      </Text>

      <Text style={smallText}>
        If you weren't expecting this invitation, you can safely ignore this email.
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
  margin: '0 0 8px 0',
};

const roleText = {
  color: '#1f2937',
  fontSize: '20px',
  fontWeight: '600',
  margin: '0 0 16px 0',
};

const roleDescription1 = {
  color: '#4b5563',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0',
};

const ctaSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const acceptButton = {
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

export default TeamInvitation;
