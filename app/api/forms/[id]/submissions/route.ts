import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/clerk-auth';
import { prisma } from '@/lib/prisma';
import { decryptJSON } from '@/lib/encryption';
import { log } from '@/lib/logger';

// GET - Get all submissions for a form
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { id } = await context.params;

    // Verify the form belongs to the user
    const form = await prisma.form.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    const submissions = await prisma.formSubmission.findMany({
      where: { formId: id },
      orderBy: { createdAt: 'desc' },
    });

    // Decrypt submissions before returning
    const decryptedSubmissions = submissions.map((submission) => {
      try {
        const decryptedData = decryptJSON<Record<string, any>>(
          submission.data,
          submission.dataIv,
          submission.dataAuth
        );

        return {
          id: submission.id,
          formId: submission.formId,
          userId: submission.userId,
          data: decryptedData, // Decrypted form data
          ipAddress: submission.ipAddress,
          userAgent: submission.userAgent,
          status: submission.status,
          createdAt: submission.createdAt,
          updatedAt: submission.updatedAt,
        };
      } catch (error) {
        log.error('[Forms] Failed to decrypt submission', {
          error,
          submissionId: submission.id,
        });
        return {
          id: submission.id,
          formId: submission.formId,
          userId: submission.userId,
          data: { error: 'Failed to decrypt submission data' },
          ipAddress: submission.ipAddress,
          userAgent: submission.userAgent,
          status: submission.status,
          createdAt: submission.createdAt,
          updatedAt: submission.updatedAt,
        };
      }
    });

    return NextResponse.json({ submissions: decryptedSubmissions });
  } catch (error) {
    log.error('[Forms] Failed to fetch submissions', error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}
