import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/clerk-auth';
import { hasFeatureAccess } from '@/lib/subscription';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { log } from '@/lib/logger';

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  description: z.string().optional(),
  color: z.string().default('#3b82f6'),
  order: z.number().int().default(0),
});

// GET - Get a single category
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

    const category = await prisma.knowledgeBaseCategory.findFirst({
      where: {
        id,
        userId: user.id,
      },
      include: {
        _count: {
          select: { articles: true },
        },
      },
    });

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ category });
  } catch (error) {
    log.error('[Knowledge] Error fetching category:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category' },
      { status: 500 }
    );
  }
}

// PATCH - Update a category
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
    const validatedData = categorySchema.parse(body);

    // Check if new slug conflicts with existing category (excluding current)
    if (validatedData.slug) {
      const existingCategory = await prisma.knowledgeBaseCategory.findFirst({
        where: {
          userId: user.id,
          slug: validatedData.slug,
          NOT: { id },
        },
      });

      if (existingCategory) {
        return NextResponse.json(
          { error: 'A category with this slug already exists' },
          { status: 400 }
        );
      }
    }

    const category = await prisma.knowledgeBaseCategory.updateMany({
      where: {
        id,
        userId: user.id,
      },
      data: validatedData,
    });

    if (category.count === 0) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    const updatedCategory = await prisma.knowledgeBaseCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: { articles: true },
        },
      },
    });

    return NextResponse.json({ category: updatedCategory });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    log.error('[Knowledge] Error updating category:', error);
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a category
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

    const result = await prisma.knowledgeBaseCategory.deleteMany({
      where: {
        id,
        userId: user.id,
      },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error('[Knowledge] Error deleting category:', error);
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}
