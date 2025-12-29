import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema for form submission
const submitSchema = z.object({
  formId: z.string(),
  data: z.record(z.string(), z.unknown()),
});

// POST - Submit a form (public endpoint)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
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

    // Create submission
    const submission = await prisma.formSubmission.create({
      data: {
        formId: form.id,
        userId: form.userId,
        data: validatedData.data,
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
    };

    if (settings.emailNotifications && settings.notificationEmail) {
      // TODO: Implement email notification
      console.log(`[Form Submission] Would send email to: ${settings.notificationEmail}`);
    }

    return NextResponse.json({
      success: true,
      message: settings.successMessage || 'Thank you for your submission!',
      submissionId: submission.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid submission data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error submitting form:', error);
    return NextResponse.json(
      { error: 'Failed to submit form' },
      { status: 500 }
    );
  }
}
