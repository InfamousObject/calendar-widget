import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/clerk-auth';
import { prisma } from '@/lib/prisma';
import { hasFeatureAccess } from '@/lib/subscription';
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

// GET - List articles with filtering
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search');
    const type = searchParams.get('type');

    const where: any = { userId: user.id };

    if (status) {
      where.status = status;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (type) {
      where.type = type;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
      ];
    }

    const articles = await prisma.knowledgeBase.findMany({
      where,
      orderBy: [
        { isPinned: 'desc' },
        { updatedAt: 'desc' },
      ],
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

    return NextResponse.json({ articles });
  } catch (error) {
    log.error('[Knowledge] Error fetching articles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    );
  }
}

// POST - Create a new article
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
    const validatedData = articleSchema.parse(body);

    // Check if slug already exists for this user
    const existingArticle = await prisma.knowledgeBase.findUnique({
      where: {
        userId_slug: {
          userId: user.id,
          slug: validatedData.slug,
        },
      },
    });

    if (existingArticle) {
      return NextResponse.json(
        { error: 'An article with this slug already exists' },
        { status: 400 }
      );
    }

    // Prepare data for create, handling null values properly
    const createData: any = {
      userId: user.id,
      ...validatedData,
    };
    if (createData.categoryId === null) {
      createData.categoryId = undefined;
    }
    if (createData.metadata === null) {
      createData.metadata = undefined;
    }

    const article = await prisma.knowledgeBase.create({
      data: createData,
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

    return NextResponse.json({ article }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    log.error('[Knowledge] Error creating article:', error);
    return NextResponse.json(
      { error: 'Failed to create article' },
      { status: 500 }
    );
  }
}
