import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const configSchema = z.object({
  enabled: z.boolean(),
  botName: z.string().min(1, 'Bot name is required'),
  greetingMessage: z.string().min(1, 'Greeting message is required'),
  tone: z.enum(['professional', 'friendly', 'casual'], {
    errorMap: () => ({ message: 'Tone must be professional, friendly, or casual' }),
  }),
  customInstructions: z.string().optional().transform(val => val?.trim() || undefined),
  enableFaq: z.boolean(),
  enableLeadQual: z.boolean(),
  enableScheduling: z.boolean(),
  model: z.string().min(1, 'AI model is required'),
  maxTokens: z.number().int().min(256, 'Max tokens must be at least 256').max(4096, 'Max tokens cannot exceed 4096'),
  temperature: z.number().min(0, 'Temperature must be between 0 and 1').max(1, 'Temperature must be between 0 and 1'),
  messageLimit: z.number().int().min(0, 'Message limit cannot be negative').default(100),
});

// GET - Get chatbot configuration
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let config = await prisma.chatbotConfig.findUnique({
      where: { userId: user.id },
    });

    // Create default config if doesn't exist
    if (!config) {
      config = await prisma.chatbotConfig.create({
        data: {
          userId: user.id,
          enabled: false,
          botName: 'Assistant',
          greetingMessage: 'Hi! How can I help you today?',
          tone: 'professional',
          enableFaq: true,
          enableLeadQual: true,
          enableScheduling: true,
          model: 'claude-opus-4-5-20251101',
          maxTokens: 1024,
          temperature: 0.7,
          messageLimit: 100,
        },
      });
    }

    return NextResponse.json({ config });
  } catch (error) {
    console.error('Error fetching chatbot config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch configuration' },
      { status: 500 }
    );
  }
}

// POST - Update chatbot configuration
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = configSchema.parse(body);

    // Force model to always be Opus
    const configData = {
      ...validatedData,
      model: 'claude-opus-4-5-20251101',
    };

    const config = await prisma.chatbotConfig.upsert({
      where: { userId: user.id },
      update: configData,
      create: {
        userId: user.id,
        ...configData,
      },
    });

    return NextResponse.json({ config });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating chatbot config:', error);
    return NextResponse.json(
      { error: 'Failed to update configuration' },
      { status: 500 }
    );
  }
}
