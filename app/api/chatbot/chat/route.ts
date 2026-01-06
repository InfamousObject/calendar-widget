import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateChatResponse, Message, KnowledgeBaseArticle } from '@/lib/claude';
import { incrementUsage, hasFeatureAccess } from '@/lib/subscription';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { validateCsrfToken, isCsrfEnabled } from '@/lib/csrf';
import { z } from 'zod';
import { log } from '@/lib/logger';

const chatSchema = z.object({
  widgetId: z.string(),
  visitorId: z.string(),
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    })
  ),
  csrfToken: z.string().optional(), // CSRF token for request validation
});

// POST - Send a chat message and get AI response
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Get client IP for CSRF and rate limiting
    const clientIp = getClientIp(request);

    // Verify CSRF token if enabled (before other validations to fail fast on forged requests)
    if (isCsrfEnabled()) {
      if (!body.csrfToken) {
        return NextResponse.json(
          { error: 'CSRF token required. Please refresh the page and try again.' },
          { status: 403 }
        );
      }

      const csrfValid = await validateCsrfToken(body.csrfToken, clientIp);
      if (!csrfValid) {
        return NextResponse.json(
          { error: 'Invalid or expired CSRF token. Please refresh the page and try again.' },
          { status: 403 }
        );
      }

      log.info('[Chatbot] CSRF validation successful', { ip: clientIp });
    }

    // Check rate limit (critical for preventing expensive API abuse)
    const { success, remaining } = await checkRateLimit('chatbot', clientIp);

    if (!success) {
      return NextResponse.json(
        { error: 'Too many chat requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': remaining.toString(),
          },
        }
      );
    }

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

    // Check if user's subscription plan includes chatbot access
    const hasChatbotAccess = await hasFeatureAccess(user.id, 'hasChatbot');
    if (!hasChatbotAccess) {
      return NextResponse.json(
        { error: 'Chatbot is only available on Chatbot and Bundle plans. Please upgrade to access this feature.' },
        { status: 403 }
      );
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
      log.error('[Chatbot] ANTHROPIC_API_KEY not configured in environment');
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

    // Check message count limit
    if (usage && usage.messagesCount >= user.chatbotConfig.messageLimit) {
      return NextResponse.json(
        { error: 'Monthly message limit reached. Please upgrade your plan.' },
        { status: 429 }
      );
    }

    // Check cost limit - prevent runaway API costs
    // User-configurable limit (default $50/month = 5000 cents)
    const costLimitCents = user.chatbotConfig.costLimitCents;
    if (usage && usage.estimatedCost >= costLimitCents) {
      return NextResponse.json(
        {
          error: `Monthly API cost limit reached ($${(costLimitCents / 100).toFixed(2)}). This protects against unexpected charges. You can adjust this limit in your chatbot settings.`,
          currentCost: (usage.estimatedCost / 100).toFixed(2),
          limit: (costLimitCents / 100).toFixed(2)
        },
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

    log.info('[Chatbot] Base URL:', baseUrl);
    log.info('[Chatbot] Widget ID:', validatedData.widgetId);
    log.info('[Chatbot] Messages count:', validatedData.messages.length);

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

    // Track usage for billing
    await incrementUsage(user.id, 'chat_message');

    return NextResponse.json({
      message: chatResponse.message,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      log.error('[Chatbot] Validation error:', error.issues);
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    log.error('[Chatbot] Error details:', error);
    log.error('[Chatbot] Error message:', error instanceof Error ? error.message : String(error));
    log.error('[Chatbot] Error stack:', error instanceof Error ? error.stack : 'No stack');

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
