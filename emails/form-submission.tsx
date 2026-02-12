import { Section, Text, Heading } from '@react-email/components';
import { EmailLayout } from './components/email-layout';
import { format } from 'date-fns';

interface FormSubmissionNotificationProps {
  formName: string;
  submissionId: string;
  submittedAt: Date;
  fields: Array<{ label: string; value: string }>;
}

export function FormSubmissionNotification({
  formName,
  submissionId,
  submittedAt,
  fields,
}: FormSubmissionNotificationProps) {
  const formattedDate = format(submittedAt, 'PPpp'); // e.g., "Apr 29, 2023, 5:30 PM"

  return (
    <EmailLayout preview={`New form submission: ${formName}`}>
      <Heading style={h1}>New Form Submission</Heading>

      <Text style={text}>
        You have received a new submission for <strong>{formName}</strong>.
      </Text>

      <Section style={detailsBox}>
        {fields.map((field, index) => (
          <div key={index}>
            <Text style={detailLabel}>{field.label}:</Text>
            <Text style={detailValue}>{field.value || '—'}</Text>
          </div>
        ))}
      </Section>

      <Section style={metaBox}>
        <Text style={metaText}>Submitted: {formattedDate}</Text>
        <Text style={metaText}>Submission ID: {submissionId}</Text>
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

const metaBox = {
  borderTop: '1px solid #e5e7eb',
  paddingTop: '16px',
  marginTop: '8px',
};

const metaText = {
  color: '#9ca3af',
  fontSize: '12px',
  margin: '0 0 4px 0',
};
