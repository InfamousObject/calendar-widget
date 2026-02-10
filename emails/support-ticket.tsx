import { Section, Text, Heading, Link, Hr } from '@react-email/components';
import { EmailLayout } from './components/email-layout';

interface SupportTicketNotificationProps {
  ticketId: string;
  userEmail: string;
  userName: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  currentPage?: string | null;
  browserInfo?: string | null;
  subscriptionTier?: string | null;
  aiDiagnosis?: string | null;
  aiSuggestedFix?: string | null;
}

export function SupportTicketNotification({
  ticketId,
  userEmail,
  userName,
  subject,
  description,
  category,
  priority,
  currentPage,
  browserInfo,
  subscriptionTier,
  aiDiagnosis,
  aiSuggestedFix,
}: SupportTicketNotificationProps) {
  const priorityColors: Record<string, string> = {
    low: '#22c55e',
    normal: '#3b82f6',
    high: '#f59e0b',
    urgent: '#ef4444',
  };

  const priorityColor = priorityColors[priority] || '#3b82f6';

  return (
    <EmailLayout preview={`Support Ticket: ${subject}`}>
      <Heading style={h1}>New Support Ticket</Heading>

      <Section style={headerBox}>
        <Text style={ticketIdText}>Ticket #{ticketId.slice(-8).toUpperCase()}</Text>
        <Text style={priorityBadge}>
          <span style={{ ...badge, backgroundColor: priorityColor }}>
            {priority.toUpperCase()}
          </span>
          <span style={{ ...badge, backgroundColor: '#6b7280', marginLeft: '8px' }}>
            {category}
          </span>
        </Text>
      </Section>

      <Section style={detailsBox}>
        <Text style={detailLabel}>From</Text>
        <Text style={detailValue}>
          {userName} ({userEmail})
        </Text>

        <Text style={detailLabel}>Subject</Text>
        <Text style={detailValue}>{subject}</Text>

        <Text style={detailLabel}>Description</Text>
        <Text style={descriptionText}>{description}</Text>
      </Section>

      <Section style={contextBox}>
        <Text style={contextTitle}>User Context</Text>
        <Text style={contextItem}>
          <strong>Subscription:</strong> {subscriptionTier || 'Unknown'}
        </Text>
        {currentPage && (
          <Text style={contextItem}>
            <strong>Page:</strong> {currentPage}
          </Text>
        )}
        {browserInfo && (
          <Text style={contextItem}>
            <strong>Browser:</strong> {browserInfo}
          </Text>
        )}
      </Section>

      {aiDiagnosis && (
        <>
          <Hr style={divider} />
          <Section style={aiBox}>
            <Text style={aiTitle}>AI Analysis</Text>

            <Text style={aiSectionLabel}>Diagnosis</Text>
            <Text style={aiContent}>{aiDiagnosis}</Text>

            {aiSuggestedFix && (
              <>
                <Text style={aiSectionLabel}>Suggested Actions</Text>
                <Text style={aiContent}>{aiSuggestedFix}</Text>
              </>
            )}
          </Section>
        </>
      )}

      <Section style={actionSection}>
        <Link
          href={`${process.env.NEXT_PUBLIC_APP_URL}/admin/support/${ticketId}`}
          style={button}
        >
          View Ticket in Dashboard
        </Link>
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

const headerBox = {
  marginBottom: '24px',
};

const ticketIdText = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '0',
};

const priorityBadge = {
  marginTop: '8px',
};

const badge = {
  display: 'inline-block',
  padding: '4px 12px',
  borderRadius: '9999px',
  color: '#ffffff',
  fontSize: '12px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
};

const detailsBox = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  padding: '20px',
  margin: '0 0 24px 0',
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

const descriptionText = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0',
  whiteSpace: 'pre-wrap' as const,
};

const contextBox = {
  backgroundColor: '#f0f9ff',
  borderRadius: '8px',
  padding: '16px',
  margin: '0 0 24px 0',
};

const contextTitle = {
  color: '#0369a1',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0 0 12px 0',
};

const contextItem = {
  color: '#374151',
  fontSize: '14px',
  margin: '0 0 8px 0',
};

const divider = {
  borderTop: '1px solid #e5e7eb',
  margin: '24px 0',
};

const aiBox = {
  backgroundColor: '#fefce8',
  borderRadius: '8px',
  padding: '20px',
  border: '1px solid #fef08a',
};

const aiTitle = {
  color: '#854d0e',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 16px 0',
};

const aiSectionLabel = {
  color: '#a16207',
  fontSize: '12px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  margin: '16px 0 8px 0',
};

const aiContent = {
  color: '#422006',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0',
  whiteSpace: 'pre-wrap' as const,
};

const actionSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#3b82f6',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600',
  padding: '12px 24px',
  textDecoration: 'none',
};
