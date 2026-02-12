import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { verifyCaptcha } from '@/lib/captcha';
import { encryptJSON } from '@/lib/encryption';
import { log } from '@/lib/logger';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
export { OPTIONS } from '@/lib/cors';

// Schema for form submission
const submitSchema = z.object({
  formId: z.string(),
  data: z.record(z.string(), z.unknown()),
  captchaToken: z.string().optional(), // hCaptcha token for bot protection
});

// POST - Submit a form (public endpoint)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Get client IP for rate limiting and CAPTCHA verification
    const clientIp = getClientIp(request);

    // Verify CAPTCHA if configured and token provided (embeds skip CAPTCHA, rate limiting protects)
    if (process.env.HCAPTCHA_SECRET_KEY && body.captchaToken) {
      const captchaValid = await verifyCaptcha(body.captchaToken, clientIp);
      if (!captchaValid) {
        return NextResponse.json(
          { error: 'CAPTCHA verification failed. Please try again.' },
          { status: 400 }
        );
      }

      log.info('[Form Submit] CAPTCHA verification successful', { ip: clientIp });
    }

    // Check rate limit
    const { success, remaining } = await checkRateLimit('formSubmission', clientIp);

    if (!success) {
      return NextResponse.json(
        { error: 'Too many form submissions. Please try again later.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': remaining.toString(),
          },
        }
      );
    }

    const validatedData = submitSchema.parse(body);

    // Get the form to verify it exists and is active
    const form = await prisma.form.findUnique({
      where: { id: validatedData.formId },
      include: { user: true },
    });

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    if (!form.active) {
      return NextResponse.json({ error: 'Form is not active' }, { status: 400 });
    }

    // Validate submitted data against form fields
    const formFields = form.fields as Array<{
      id: string;
      label: string;
      fieldType: string;
      required: boolean;
    }>;

    // Check required fields
    for (const field of formFields) {
      if (field.required && !validatedData.data[field.id]) {
        return NextResponse.json(
          { error: `Field "${field.label}" is required` },
          { status: 400 }
        );
      }
    }

    // Get IP and user agent
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Encrypt form data before saving (protect PII)
    const { encrypted, iv, authTag } = encryptJSON(validatedData.data);

    // Create submission with encrypted form data
    const submission = await prisma.formSubmission.create({
      data: {
        formId: form.id,
        userId: form.userId,
        data: encrypted,      // Encrypted hex string
        dataIv: iv,           // Initialization vector
        dataAuth: authTag,    // Authentication tag
        ipAddress,
        userAgent,
        status: 'new',
      },
    });

    // Send email notification if enabled
    const settings = form.settings as {
      successMessage?: string;
      emailNotifications?: boolean;
      notificationEmail?: string;
    } | null;

    log.info('[Form Submission] Email settings check', {
      emailNotifications: settings?.emailNotifications,
      hasNotificationEmail: !!settings?.notificationEmail,
      formId: form.id,
    });

    if (settings?.emailNotifications && settings?.notificationEmail) {
      try {
        const { sendFormSubmissionNotification } = await import('@/lib/email');

        const fields = formFields.map((field) => ({
          label: field.label,
          value: String(validatedData.data[field.id] ?? ''),
        }));

        const result = await sendFormSubmissionNotification({
          notificationEmail: settings.notificationEmail,
          formName: form.name,
          submissionId: submission.id,
          submittedAt: submission.createdAt,
          fields,
        });
        if (result) {
          log.info('[Form Submission] Notification email sent');
        } else {
          log.error('[Form Submission] Email send returned null (failed silently)', {
            formId: form.id,
            notificationEmail: settings.notificationEmail,
          });
        }
      } catch (error) {
        log.error('[Form Submission] Failed to send notification', error);
        // Don't fail the submission if email fails
      }
    } else {
      log.info('[Form Submission] Email notification skipped (not enabled or no email configured)', {
        formId: form.id,
      });
    }

    // TODO: Implement server-side conversion API for GA4 Measurement Protocol
    // trackConversion('form_submitted', { form_id: form.id, form_name: form.name })

    return NextResponse.json({
      success: true,
      message: settings?.successMessage || 'Thank you for your submission!',
      submissionId: submission.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid submission data', details: error.issues },
        { status: 400 }
      );
    }

    log.error('[Form Submission] Error submitting form', error);
    return NextResponse.json(
      { error: 'Failed to submit form' },
      { status: 500 }
    );
  }
}
