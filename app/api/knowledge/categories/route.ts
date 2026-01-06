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

// GET - List all categories
export async function GET(request: NextRequest) {
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

    const categories = await prisma.knowledgeBaseCategory.findMany({
      where: { userId: user.id },
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { articles: true },
        },
      },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    log.error('[Knowledge] Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// POST - Create a new category
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const validatedData = categorySchema.parse(body);

    // Check if slug already exists for this user
    const existingCategory = await prisma.knowledgeBaseCategory.findUnique({
      where: {
        userId_slug: {
          userId: user.id,
          slug: validatedData.slug,
        },
      },
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: 'A category with this slug already exists' },
        { status: 400 }
      );
    }

    const category = await prisma.knowledgeBaseCategory.create({
      data: {
        userId: user.id,
        ...validatedData,
      },
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    log.error('[Knowledge] Error creating category:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}
