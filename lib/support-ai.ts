import Anthropic from '@anthropic-ai/sdk';
import { log } from '@/lib/logger';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'dummy-key-for-build',
});

interface TicketContext {
  subject: string;
  description: string;
  category: string;
  currentPage?: string | null;
  browserInfo?: string | null;
  subscriptionTier?: string | null;
}

interface AnalysisResult {
  diagnosis: string;
  suggestedFix: string;
}

// Common issue patterns for quick diagnosis
const KNOWN_ISSUES = [
  {
    pattern: /calendar|availability|time\s*slot|booking/i,
    area: 'Scheduling System',
    commonFixes: [
      'Check availability settings in Dashboard > Availability',
      'Verify timezone settings match your business location',
      'Ensure appointment types are marked as active',
    ],
  },
  {
    pattern: /payment|stripe|charge|billing/i,
    area: 'Payment/Billing',
    commonFixes: [
      'Verify Stripe Connect onboarding is complete',
      'Check subscription status in Dashboard > Billing',
      'Confirm price is set correctly on appointment type',
    ],
  },
  {
    pattern: /embed|widget|iframe|install/i,
    area: 'Widget Installation',
    commonFixes: [
      'Verify Widget ID is correct in embed code',
      'Check if CSP policy allows kentroi.com',
      'Ensure page is served over HTTPS',
    ],
  },
  {
    pattern: /chatbot|ai|message|conversation/i,
    area: 'AI Chatbot',
    commonFixes: [
      'Verify Chatbot or Bundle subscription is active',
      'Check chatbot configuration in Dashboard > Chatbot',
      'Review knowledge base for relevant content',
    ],
  },
  {
    pattern: /team|member|invite|permission/i,
    area: 'Team Management',
    commonFixes: [
      'Verify team seat availability in Dashboard > Team',
      'Check if invitation email was received',
      'Confirm user role has necessary permissions',
    ],
  },
  {
    pattern: /email|notification|not\s*receiving/i,
    area: 'Email Notifications',
    commonFixes: [
      'Check spam/junk folder for emails',
      'Verify email address in account settings',
      'Ensure notification preferences are enabled',
    ],
  },
];

/**
 * Analyze a support ticket using Claude AI
 */
export async function analyzeSupportTicket(
  ticketId: string,
  context: TicketContext
): Promise<AnalysisResult | null> {
  try {
    // Quick pattern matching for common issues
    const matchedIssue = KNOWN_ISSUES.find((issue) =>
      issue.pattern.test(context.subject) || issue.pattern.test(context.description)
    );

    const systemPrompt = `You are a technical support analyst for Kentroi, a SaaS booking and AI chatbot platform.

Your job is to analyze support tickets and provide:
1. A diagnosis of the likely issue (2-3 sentences)
2. Suggested fixes or next steps (3-5 bullet points)

Platform context:
- Kentroi offers booking widgets, contact forms, and AI chatbots
- Users embed these on their websites via iframes
- Subscription tiers: Free, Booking, Chatbot, Bundle
- Team features available on Booking/Bundle plans

${matchedIssue ? `This appears to be related to: ${matchedIssue.area}` : ''}

Be concise, technical, and actionable. Focus on what the support team can check or suggest to the user.`;

    const userMessage = `Support Ticket Analysis Request:

Subject: ${context.subject}

Description:
${context.description}

User Context:
- Current Page: ${context.currentPage || 'Not specified'}
- Browser: ${context.browserInfo || 'Not specified'}
- Subscription Tier: ${context.subscriptionTier || 'Unknown'}
- Category: ${context.category}

Please provide:
1. DIAGNOSIS: What is likely causing this issue?
2. SUGGESTED FIXES: What should we check or recommend?`;

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
    });

    // Extract text content from response
    const textContent = response.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in AI response');
    }

    const fullResponse = textContent.text;

    // Parse the response into diagnosis and suggested fix
    const diagnosisMatch = fullResponse.match(/DIAGNOSIS:?\s*([\s\S]*?)(?=SUGGESTED|$)/i);
    const fixMatch = fullResponse.match(/SUGGESTED\s*FIXES?:?\s*([\s\S]*?)$/i);

    const diagnosis = diagnosisMatch
      ? diagnosisMatch[1].trim()
      : fullResponse.substring(0, 500);

    let suggestedFix = fixMatch
      ? fixMatch[1].trim()
      : '';

    // Add known fixes if we have a pattern match
    if (matchedIssue && matchedIssue.commonFixes.length > 0) {
      suggestedFix += '\n\nCommon fixes for this issue type:\n' +
        matchedIssue.commonFixes.map((fix) => `- ${fix}`).join('\n');
    }

    log.info('[Support AI] Analysis completed', { ticketId });

    return {
      diagnosis,
      suggestedFix,
    };
  } catch (error) {
    log.error('[Support AI] Analysis failed', {
      ticketId,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}
