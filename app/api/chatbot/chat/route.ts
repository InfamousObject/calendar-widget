import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateChatResponse, Message, KnowledgeBaseArticle } from '@/lib/claude';
import { z } from 'zod';

const chatSchema = z.object({
  widgetId: z.string(),
  visitorId: z.string(),
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    })
  ),
});

// POST - Send a chat message and get AI response
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = chatSchema.parse(body);

    // Find user by widgetId
    const user = await prisma.user.findUnique({
      where: { widgetId: validatedData.widgetId },
      include: {
        chatbotConfig: true,
        knowledgeBase: {
          where: { status: 'published' },
          select: {
            title: true,
            content: true,
            category: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Widget not found' }, { status: 404 });
    }

    if (!user.chatbotConfig) {
      return NextResponse.json({ error: 'Chatbot not configured' }, { status: 400 });
    }

    if (!user.chatbotConfig.enabled) {
      return NextResponse.json({ error: 'Chatbot is not enabled' }, { status: 400 });
    }

    // Check shared API key exists
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY not configured in environment');
      return NextResponse.json({ error: 'Chatbot service unavailable' }, { status: 500 });
    }

    // Check usage limits
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const usage = await prisma.chatbotUsage.findUnique({
      where: {
        userId_year_month: {
          userId: user.id,
          year: currentYear,
          month: currentMonth,
        },
      },
    });

    if (usage && usage.messagesCount >= user.chatbotConfig.messageLimit) {
      return NextResponse.json(
        { error: 'Monthly message limit reached. Please upgrade your plan.' },
        { status: 429 }
      );
    }

    // Prepare knowledge base
    const knowledgeBase: KnowledgeBaseArticle[] = user.knowledgeBase.map((article) => ({
      title: article.title,
      content: article.content,
      category: article.category?.name,
    }));

    // Get base URL from request
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;

    console.log('[Chat] Base URL:', baseUrl);
    console.log('[Chat] Widget ID:', validatedData.widgetId);
    console.log('[Chat] Messages count:', validatedData.messages.length);

    // Generate AI response
    const chatResponse = await generateChatResponse(
      apiKey,
      {
        botName: user.chatbotConfig.botName,
        greetingMessage: user.chatbotConfig.greetingMessage,
        tone: user.chatbotConfig.tone,
        customInstructions: user.chatbotConfig.customInstructions || undefined,
        enableFaq: user.chatbotConfig.enableFaq,
        enableLeadQual: user.chatbotConfig.enableLeadQual,
        enableScheduling: user.chatbotConfig.enableScheduling,
        model: user.chatbotConfig.model,
        maxTokens: user.chatbotConfig.maxTokens,
        temperature: user.chatbotConfig.temperature,
      },
      validatedData.messages,
      knowledgeBase,
      user.businessName || 'our business',
      validatedData.widgetId,
      user.timezone,
      baseUrl
    );

    // Save conversation
    const allMessages = [
      ...validatedData.messages,
      {
        role: 'assistant' as const,
        content: chatResponse.message,
      },
    ];

    await prisma.conversation.upsert({
      where: {
        id: `${user.id}-${validatedData.visitorId}`,
      },
      update: {
        messages: allMessages,
        updatedAt: new Date(),
      },
      create: {
        id: `${user.id}-${validatedData.visitorId}`,
        userId: user.id,
        chatbotConfigId: user.chatbotConfig.id,
        visitorId: validatedData.visitorId,
        messages: allMessages,
        leadQualified: false,
      },
    });

    // Calculate cost estimate (in cents)
    // Claude Haiku pricing (as of 2025): $0.25/1M input, $1.25/1M output
    const inputCostPer1M = 0.25;
    const outputCostPer1M = 1.25;
    const estimatedCost = Math.ceil(
      (chatResponse.inputTokens / 1_000_000) * inputCostPer1M * 100 +
      (chatResponse.outputTokens / 1_000_000) * outputCostPer1M * 100
    );

    // Track usage
    await prisma.chatbotUsage.upsert({
      where: {
        userId_year_month: {
          userId: user.id,
          year: currentYear,
          month: currentMonth,
        },
      },
      update: {
        messagesCount: { increment: 1 },
        inputTokens: { increment: chatResponse.inputTokens },
        outputTokens: { increment: chatResponse.outputTokens },
        estimatedCost: { increment: estimatedCost },
      },
      create: {
        userId: user.id,
        chatbotConfigId: user.chatbotConfig.id,
        year: currentYear,
        month: currentMonth,
        messagesCount: 1,
        inputTokens: chatResponse.inputTokens,
        outputTokens: chatResponse.outputTokens,
        estimatedCost,
      },
    });

    return NextResponse.json({
      message: chatResponse.message,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('[Chat] Validation error:', error.errors);
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('[Chat] Error details:', error);
    console.error('[Chat] Error message:', error instanceof Error ? error.message : String(error));
    console.error('[Chat] Error stack:', error instanceof Error ? error.stack : 'No stack');

    // Handle Anthropic API errors
    if (error instanceof Error) {
      if (error.message.includes('authentication') || error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'Invalid API key configuration' },
          { status: 500 }
        );
      }
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}
