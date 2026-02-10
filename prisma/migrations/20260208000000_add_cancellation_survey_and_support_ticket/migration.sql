-- CreateTable: CancellationSurvey
CREATE TABLE "CancellationSurvey" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "reasonDetails" TEXT,
    "subscriptionTier" TEXT NOT NULL,
    "monthsSubscribed" INTEGER NOT NULL,
    "feedback" TEXT,
    "discountCode" TEXT,
    "discountRedeemed" BOOLEAN NOT NULL DEFAULT false,
    "reengagementSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CancellationSurvey_pkey" PRIMARY KEY ("id")
);

-- CreateTable: SupportTicket
CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "status" TEXT NOT NULL DEFAULT 'open',
    "currentPage" TEXT,
    "browserInfo" TEXT,
    "subscriptionTier" TEXT,
    "screenshotUrl" TEXT,
    "aiDiagnosis" TEXT,
    "aiSuggestedFix" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable: WebhookEvent
CREATE TABLE IF NOT EXISTS "WebhookEvent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CancellationSurvey_userId_idx" ON "CancellationSurvey"("userId");

-- CreateIndex
CREATE INDEX "CancellationSurvey_reason_idx" ON "CancellationSurvey"("reason");

-- CreateIndex
CREATE INDEX "SupportTicket_userId_status_idx" ON "SupportTicket"("userId", "status");

-- CreateIndex (WebhookEvent - only if not exists)
CREATE UNIQUE INDEX IF NOT EXISTS "WebhookEvent_eventId_key" ON "WebhookEvent"("eventId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "WebhookEvent_provider_eventId_idx" ON "WebhookEvent"("provider", "eventId");

-- AddForeignKey
ALTER TABLE "CancellationSurvey" ADD CONSTRAINT "CancellationSurvey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey (WebhookEvent has no FK)

-- Add Stripe Connect fields to User (if not already present)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "stripeConnectAccountId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "stripeConnectOnboarded" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "stripeConnectPayoutsEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex for Stripe Connect
CREATE UNIQUE INDEX IF NOT EXISTS "User_stripeConnectAccountId_key" ON "User"("stripeConnectAccountId");

-- Add source column to CalendarConnection
ALTER TABLE "CalendarConnection" ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'manual';

-- Add payment fields to AppointmentType
ALTER TABLE "AppointmentType" ADD COLUMN IF NOT EXISTS "price" INTEGER;
ALTER TABLE "AppointmentType" ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'usd';
ALTER TABLE "AppointmentType" ADD COLUMN IF NOT EXISTS "requirePayment" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "AppointmentType" ADD COLUMN IF NOT EXISTS "depositPercent" INTEGER;
ALTER TABLE "AppointmentType" ADD COLUMN IF NOT EXISTS "refundPolicy" TEXT NOT NULL DEFAULT 'full';

-- Add payment fields to Appointment
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "paymentIntentId" TEXT;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "paymentStatus" TEXT;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "amountPaid" INTEGER;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "currency" TEXT;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "refundId" TEXT;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "refundAmount" INTEGER;

-- Add missing Appointment indexes
CREATE INDEX IF NOT EXISTS "Appointment_userId_status_idx" ON "Appointment"("userId", "status");
CREATE INDEX IF NOT EXISTS "Appointment_appointmentTypeId_startTime_idx" ON "Appointment"("appointmentTypeId", "startTime");
CREATE INDEX IF NOT EXISTS "Appointment_status_startTime_idx" ON "Appointment"("status", "startTime");
CREATE INDEX IF NOT EXISTS "Appointment_cancellationToken_idx" ON "Appointment"("cancellationToken");
CREATE INDEX IF NOT EXISTS "Appointment_paymentIntentId_idx" ON "Appointment"("paymentIntentId");

-- Add missing FormSubmission indexes
CREATE INDEX IF NOT EXISTS "FormSubmission_userId_status_createdAt_idx" ON "FormSubmission"("userId", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "FormSubmission_formId_createdAt_idx" ON "FormSubmission"("formId", "createdAt");

-- Add daysToDisplay to WidgetConfig
ALTER TABLE "WidgetConfig" ADD COLUMN IF NOT EXISTS "daysToDisplay" INTEGER NOT NULL DEFAULT 7;

-- Add team invitation fields to TeamMember
ALTER TABLE "TeamMember" ADD COLUMN IF NOT EXISTS "invitationToken" TEXT;
ALTER TABLE "TeamMember" ADD COLUMN IF NOT EXISTS "invitationExpiry" TIMESTAMP(3);
ALTER TABLE "TeamMember" ADD COLUMN IF NOT EXISTS "receiveNotifications" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex for TeamMember invitation token
CREATE UNIQUE INDEX IF NOT EXISTS "TeamMember_invitationToken_key" ON "TeamMember"("invitationToken");
CREATE INDEX IF NOT EXISTS "TeamMember_invitationToken_idx" ON "TeamMember"("invitationToken");

-- Add missing indexes
CREATE INDEX IF NOT EXISTS "Availability_userId_dayOfWeek_idx" ON "Availability"("userId", "dayOfWeek");
CREATE INDEX IF NOT EXISTS "DateOverride_userId_date_idx" ON "DateOverride"("userId", "date");
CREATE INDEX IF NOT EXISTS "Conversation_chatbotConfigId_idx" ON "Conversation"("chatbotConfigId");
CREATE INDEX IF NOT EXISTS "UsageRecord_userId_createdAt_idx" ON "UsageRecord"("userId", "createdAt");
