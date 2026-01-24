import { Resend } from 'resend';
import { log } from '@/lib/logger';
import { BookingConfirmation } from '@/emails/booking-confirmation';
import { BookingNotification } from '@/emails/booking-notification';
import { BookingReminder } from '@/emails/booking-reminder';
import { CancellationConfirmation } from '@/emails/cancellation-confirmation';
import { FormSubmissionNotification } from '@/emails/form-submission';
import { PaymentFailureAlert } from '@/emails/payment-failure';
import { TeamInvitation } from '@/emails/team-invitation';

// Provide fallback for build time (when env vars aren't available)
const resend = new Resend(process.env.RESEND_API_KEY || 'dummy-key-for-build');
const FROM_EMAIL = 'Kentroi <noreply@kentroi.com>';

// Retry helper with exponential backoff
async function sendWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 2
): Promise<T | null> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) {
        log.error(`[Email] Failed after ${maxRetries} attempts`, error);
        return null;
      }
      const delay = Math.pow(2, attempt) * 100;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  return null;
}

// Send booking confirmation to customer
export async function sendBookingConfirmation(params: {
  appointmentId: string;
  visitorEmail: string;
  visitorName: string;
  appointmentTypeName: string;
  startTime: Date;
  endTime: Date;
  timezone: string;
  cancellationToken: string;
  businessName?: string;
  meetingLink?: string;
  meetingProvider?: string;
}) {
  const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/cancel/${params.cancellationToken}`;

  return sendWithRetry(async () => {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.visitorEmail,
      subject: `Appointment Confirmed - ${params.appointmentTypeName}`,
      react: BookingConfirmation({ ...params, cancelUrl }),
    });

    if (error) throw new Error(error.message);

    log.info('[Email] Booking confirmation sent', {
      appointmentId: params.appointmentId,
      to: params.visitorEmail, // Auto-redacted by logger
      hasMeetingLink: !!params.meetingLink,
    });

    return data;
  });
}

// Send booking notification to business owner
export async function sendBookingNotification(params: {
  appointmentId: string;
  ownerEmail: string;
  visitorName: string;
  visitorEmail: string;
  appointmentTypeName: string;
  startTime: Date;
  timezone: string;
  notes?: string;
  meetingLink?: string;
  meetingProvider?: string;
}) {
  return sendWithRetry(async () => {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.ownerEmail,
      subject: `New Booking: ${params.appointmentTypeName} with ${params.visitorName}`,
      react: BookingNotification(params),
    });

    if (error) throw new Error(error.message);

    log.info('[Email] Booking notification sent to owner', {
      appointmentId: params.appointmentId,
      to: params.ownerEmail,
      hasMeetingLink: !!params.meetingLink,
    });

    return data;
  });
}

// Send appointment reminder (24h before)
export async function sendAppointmentReminder(params: {
  appointmentId: string;
  visitorEmail: string;
  visitorName: string;
  appointmentTypeName: string;
  startTime: Date;
  timezone: string;
  cancellationToken: string;
  meetingLink?: string;
  meetingProvider?: string;
}) {
  const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/cancel/${params.cancellationToken}`;

  return sendWithRetry(async () => {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.visitorEmail,
      subject: `Reminder: ${params.appointmentTypeName} tomorrow`,
      react: BookingReminder({ ...params, cancelUrl }),
    });

    if (error) throw new Error(error.message);

    log.info('[Email] Appointment reminder sent', {
      appointmentId: params.appointmentId,
      to: params.visitorEmail,
      hasMeetingLink: !!params.meetingLink,
    });

    return data;
  });
}

// Send cancellation confirmation
export async function sendCancellationConfirmation(params: {
  visitorEmail: string;
  visitorName: string;
  appointmentTypeName: string;
  startTime: Date;
  timezone: string;
}) {
  return sendWithRetry(async () => {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.visitorEmail,
      subject: `Appointment Cancelled - ${params.appointmentTypeName}`,
      react: CancellationConfirmation(params),
    });

    if (error) throw new Error(error.message);

    log.info('[Email] Cancellation confirmation sent', {
      to: params.visitorEmail,
    });

    return data;
  });
}

// Send form submission notification
export async function sendFormSubmissionNotification(params: {
  notificationEmail: string;
  formName: string;
  submissionId: string;
  submittedAt: Date;
  fieldCount: number;
}) {
  return sendWithRetry(async () => {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.notificationEmail,
      subject: `New Form Submission: ${params.formName}`,
      react: FormSubmissionNotification(params),
    });

    if (error) throw new Error(error.message);

    log.info('[Email] Form submission notification sent', {
      submissionId: params.submissionId,
      to: params.notificationEmail,
    });

    return data;
  });
}

// Send payment failure alert
export async function sendPaymentFailureAlert(params: {
  userEmail: string;
  userName: string;
  invoiceAmount: number;
  dueDate: Date;
  invoiceUrl: string;
}) {
  return sendWithRetry(async () => {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.userEmail,
      subject: 'Payment Failed - Action Required',
      react: PaymentFailureAlert(params),
    });

    if (error) throw new Error(error.message);

    log.info('[Email] Payment failure alert sent', {
      to: params.userEmail,
    });

    return data;
  });
}

// Send team invitation
export async function sendTeamInvitation(params: {
  toEmail: string;
  toName: string;
  inviterName: string;
  accountName: string;
  role: 'admin' | 'member';
  invitationUrl: string;
  expiresAt: Date;
}) {
  return sendWithRetry(async () => {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.toEmail,
      subject: `You've been invited to join ${params.accountName} on Kentroi`,
      react: TeamInvitation(params),
    });

    if (error) throw new Error(error.message);

    log.info('[Email] Team invitation sent', {
      to: params.toEmail,
      role: params.role,
    });

    return data;
  });
}
