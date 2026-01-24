import { prisma } from '@/lib/prisma';
import type { SubscriptionTier } from '@/lib/stripe';

// Feature limits by tier
export const TIER_LIMITS = {
  free: {
    appointmentTypes: 1,
    monthlyBookings: 25,
    contactForms: Infinity,
    knowledgeBaseArticles: 0,
    chatbotMessages: 0,
    customization: 'basic' as const,
    teamSeats: 0, // Free users cannot have team members
    hasBooking: true,
    hasChatbot: false,
    removeBranding: false,
  },
  booking: {
    appointmentTypes: Infinity,
    monthlyBookings: Infinity,
    contactForms: Infinity,
    knowledgeBaseArticles: 0,
    chatbotMessages: 0,
    customization: 'full' as const,
    teamSeats: 1, // Base included, can add more
    hasBooking: true,
    hasChatbot: false,
    removeBranding: false,
  },
  chatbot: {
    appointmentTypes: 0,
    monthlyBookings: 0,
    contactForms: Infinity,
    knowledgeBaseArticles: Infinity,
    chatbotMessages: Infinity, // Pay per use
    customization: 'basic' as const,
    teamSeats: 0, // Chatbot users cannot have team members
    hasBooking: false,
    hasChatbot: true,
    removeBranding: false,
  },
  bundle: {
    appointmentTypes: Infinity,
    monthlyBookings: Infinity,
    contactForms: Infinity,
    knowledgeBaseArticles: Infinity,
    chatbotMessages: Infinity, // Pay per use (cheaper rate)
    customization: 'full' as const,
    teamSeats: 1, // Base included, can add more
    hasBooking: true,
    hasChatbot: true,
    removeBranding: true,
  },
} as const;

// Get user's subscription tier and status
export async function getUserSubscription(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      subscriptionTier: true,
      subscriptionStatus: true,
      currentPeriodEnd: true,
      monthlyBookings: true,
      monthlyChatMessages: true,
      lastUsageReset: true,
      stripeCustomerId: true,
      subscription: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  return {
    tier: user.subscriptionTier as SubscriptionTier,
    status: user.subscriptionStatus,
    currentPeriodEnd: user.currentPeriodEnd,
    usage: {
      bookings: user.monthlyBookings,
      chatMessages: user.monthlyChatMessages,
    },
    limits: TIER_LIMITS[user.subscriptionTier as SubscriptionTier],
    stripeCustomerId: user.stripeCustomerId,
    subscription: user.subscription,
  };
}

// Check if user has access to a specific feature
export async function hasFeatureAccess(userId: string, feature: keyof typeof TIER_LIMITS.free): Promise<boolean> {
  const { tier } = await getUserSubscription(userId);
  const limits = TIER_LIMITS[tier];

  // Special case for boolean features
  if (typeof limits[feature] === 'boolean') {
    return limits[feature] as boolean;
  }

  return true;
}

// Check if user is within usage limits
export async function checkUsageLimit(userId: string, limitType: 'appointmentTypes' | 'monthlyBookings' | 'chatbotMessages'): Promise<{
  allowed: boolean;
  current: number;
  limit: number;
  percentUsed: number;
}> {
  const subscription = await getUserSubscription(userId);
  const limit = subscription.limits[limitType];

  let current = 0;

  switch (limitType) {
    case 'appointmentTypes':
      current = await prisma.appointmentType.count({
        where: { userId, active: true },
      });
      break;
    case 'monthlyBookings':
      current = subscription.usage.bookings;
      break;
    case 'chatbotMessages':
      current = subscription.usage.chatMessages;
      break;
  }

  const allowed = limit === Infinity || current < limit;
  const percentUsed = limit === Infinity ? 0 : (current / limit) * 100;

  return {
    allowed,
    current,
    limit: limit === Infinity ? 0 : limit,
    percentUsed,
  };
}

// Increment usage counter
export async function incrementUsage(userId: string, type: 'booking' | 'chat_message'): Promise<void> {
  // Reset counters if it's a new month
  await resetUsageIfNeeded(userId);

  // Increment the appropriate counter
  if (type === 'booking') {
    await prisma.user.update({
      where: { id: userId },
      data: { monthlyBookings: { increment: 1 } },
    });
  } else if (type === 'chat_message') {
    await prisma.user.update({
      where: { id: userId },
      data: { monthlyChatMessages: { increment: 1 } },
    });
  }

  // Create usage record for billing
  await prisma.usageRecord.create({
    data: {
      userId,
      type,
      billable: true,
      billed: false,
    },
  });
}

// Reset usage counters if it's a new month
async function resetUsageIfNeeded(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lastUsageReset: true },
  });

  if (!user) return;

  const now = new Date();
  const lastReset = new Date(user.lastUsageReset);

  // Check if we're in a new month
  if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        monthlyBookings: 0,
        monthlyChatMessages: 0,
        lastUsageReset: now,
      },
    });
  }
}

// Get upgrade prompt message based on limit
export function getUpgradeMessage(limitType: string): string {
  const messages: Record<string, string> = {
    appointmentTypes: "You've reached the limit for appointment types on the Free plan. Upgrade to Booking or Bundle for unlimited appointment types.",
    monthlyBookings: "You've reached your monthly booking limit. Upgrade to Booking or Bundle for unlimited bookings.",
    chatbot: "AI Chatbot is only available on Chatbot and Bundle plans. Upgrade to start using AI-powered conversations.",
    customization: "Advanced customization is only available on Booking and Bundle plans.",
    teamSeats: "Additional team seats are only available on Booking and Bundle plans.",
  };

  return messages[limitType] || 'Upgrade your plan to access this feature.';
}

// Check if subscription is active
export function isSubscriptionActive(status?: string | null): boolean {
  if (!status) return false;
  return ['active', 'trialing'].includes(status);
}

// Get team seat limit
export async function getTeamSeatLimit(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { subscription: true },
  });

  if (!user) return 1;

  // Free and chatbot tiers: 1 seat only
  if (user.subscriptionTier === 'free' || user.subscriptionTier === 'chatbot') {
    return 1;
  }

  // Booking and bundle: base + additional
  if (user.subscription) {
    return user.subscription.totalSeats;
  }

  return 1;
}

// Check if user can add more team members
export async function canAddTeamMember(userId: string): Promise<{
  allowed: boolean;
  current: number;
  limit: number;
  message?: string;
}> {
  const limit = await getTeamSeatLimit(userId);
  const current = await prisma.teamMember.count({
    where: {
      accountId: userId,
      status: { in: ['active', 'pending'] },
    },
  });

  const allowed = current < limit;

  return {
    allowed,
    current,
    limit,
    message: allowed ? undefined : `You've reached your team seat limit. Add more seats for $5/month each.`,
  };
}

// Check if user's tier allows accepting payments
export async function canAcceptPayments(userId: string): Promise<{
  allowed: boolean;
  tier: string;
  message?: string;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscriptionTier: true },
  });

  const tier = user?.subscriptionTier || 'free';
  const allowed = ['booking', 'bundle'].includes(tier);

  return {
    allowed,
    tier,
    message: allowed ? undefined : 'Paid appointments require a Booking or Bundle plan',
  };
}

// Check if user's tier allows inviting team members
export async function canInviteTeamMembers(userId: string): Promise<{
  allowed: boolean;
  tier: string;
  message?: string;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscriptionTier: true },
  });

  const tier = user?.subscriptionTier || 'free';
  const allowed = ['booking', 'bundle'].includes(tier);

  return {
    allowed,
    tier,
    message: allowed ? undefined : 'Team members require a Booking or Bundle plan',
  };
}
