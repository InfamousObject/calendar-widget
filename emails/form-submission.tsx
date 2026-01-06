import { Section, Text, Heading } from '@react-email/components';
import { EmailLayout } from './components/email-layout';
import { format } from 'date-fns';

interface FormSubmissionNotificationProps {
  formName: string;
  submissionId: string;
  submittedAt: Date;
  fieldCount: number;
}

export function FormSubmissionNotification({
  formName,
  submissionId,
  submittedAt,
  fieldCount,
}: FormSubmissionNotificationProps) {
  const formattedDate = format(submittedAt, 'PPpp'); // e.g., "Apr 29, 2023, 5:30 PM"

  return (
    <EmailLayout preview={`New form submission: ${formName}`}>
      <Heading style={h1}>New Form Submission</Heading>

      <Text style={text}>
        You have received a new submission for your form.
      </Text>

      <Section style={detailsBox}>
        <Text style={detailLabel}>Form Name:</Text>
        <Text style={detailValue}>{formName}</Text>

        <Text style={detailLabel}>Submitted:</Text>
        <Text style={detailValue}>{formattedDate}</Text>

        <Text style={detailLabel}>Number of Fields:</Text>
        <Text style={detailValue}>{fieldCount}</Text>

        <Text style={detailLabel}>Submission ID:</Text>
        <Text style={detailValue}>{submissionId}</Text>
      </Section>

      <Text style={text}>
        Log in to your dashboard to view the full submission details.
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
