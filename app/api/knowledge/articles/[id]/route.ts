import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/clerk-auth';
import { hasFeatureAccess } from '@/lib/subscription';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { log } from '@/lib/logger';

const articleSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  content: z.string(), // Allow empty content for drafts
  excerpt: z.string().optional(),
  categoryId: z.string().optional().nullable(),
  type: z.enum(['article', 'faq', 'webpage']).default('article'),
  status: z.enum(['draft', 'published']).default('draft'),
  isPinned: z.boolean().default(false),
  tags: z.array(z.string()).optional(),
  url: z.union([z.string().url(), z.literal(''), z.null()]).optional(),
  metadata: z.record(z.string(), z.any()).optional().nullable(),
});

// GET - Get a single article
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

    // Check if user's subscription plan includes knowledge base access
    const hasKnowledgeAccess = await hasFeatureAccess(user.id, 'hasChatbot');
    if (!hasKnowledgeAccess) {
      return NextResponse.json(
        { error: 'Knowledge Base is only available on Chatbot and Bundle plans. Please upgrade to access this feature.' },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    const article = await prisma.knowledgeBase.findFirst({
      where: {
        id,
        userId: user.id,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
          },
        },
      },
    });

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    return NextResponse.json({ article });
  } catch (error) {
    log.error('[Knowledge] Error fetching article:', error);
    return NextResponse.json(
      { error: 'Failed to fetch article' },
      { status: 500 }
    );
  }
}

// PATCH - Update an article
export async function PATCH(
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

    // Check if user's subscription plan includes knowledge base access
    const hasKnowledgeAccess = await hasFeatureAccess(user.id, 'hasChatbot');
    if (!hasKnowledgeAccess) {
      return NextResponse.json(
        { error: 'Knowledge Base is only available on Chatbot and Bundle plans. Please upgrade to access this feature.' },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body = await request.json();
    const validatedData = articleSchema.parse(body);

    // Check if new slug conflicts with existing article (excluding current)
    if (validatedData.slug) {
      const existingArticle = await prisma.knowledgeBase.findFirst({
        where: {
          userId: user.id,
          slug: validatedData.slug,
          NOT: { id },
        },
      });

      if (existingArticle) {
        return NextResponse.json(
          { error: 'An article with this slug already exists' },
          { status: 400 }
        );
      }
    }

    // Prepare data for update, handling null categoryId properly
    const updateData: any = { ...validatedData };
    if (updateData.categoryId === null) {
      updateData.categoryId = undefined;
    }

    const article = await prisma.knowledgeBase.updateMany({
      where: {
        id,
        userId: user.id,
      },
      data: updateData,
    });

    if (article.count === 0) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    const updatedArticle = await prisma.knowledgeBase.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
          },
        },
      },
    });

    return NextResponse.json({ article: updatedArticle });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    log.error('[Knowledge] Error updating article:', error);
    return NextResponse.json(
      { error: 'Failed to update article' },
      { status: 500 }
    );
  }
}

// DELETE - Delete an article
export async function DELETE(
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

    // Check if user's subscription plan includes knowledge base access
    const hasKnowledgeAccess = await hasFeatureAccess(user.id, 'hasChatbot');
    if (!hasKnowledgeAccess) {
      return NextResponse.json(
        { error: 'Knowledge Base is only available on Chatbot and Bundle plans. Please upgrade to access this feature.' },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    const result = await prisma.knowledgeBase.deleteMany({
      where: {
        id,
        userId: user.id,
      },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error('[Knowledge] Error deleting article:', error);
    return NextResponse.json(
      { error: 'Failed to delete article' },
      { status: 500 }
    );
  }
}
