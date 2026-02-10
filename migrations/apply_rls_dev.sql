-- ============================================
-- APPLY RLS POLICIES FOR DEV DATABASE
-- ============================================
--
-- This script enables RLS on ALL 21 tables and grants the
-- `postgres` role full access (required for Prisma).
--
-- Covers the 3 tables missing from earlier scripts:
--   WebhookEvent, CancellationSurvey, SupportTicket
--
-- HOW TO APPLY:
-- 1. Go to Supabase Dashboard → SQL Editor (dev project)
-- 2. Copy and paste this entire file
-- 3. Run the query
-- 4. Verify with the query at the bottom
--
-- ============================================

-- ============================================
-- 1. ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Subscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CalendarConnection" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AppointmentType" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Availability" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DateOverride" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Appointment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BookingFormField" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Form" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FormSubmission" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WidgetConfig" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ChatbotConfig" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ChatbotUsage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "KnowledgeBaseCategory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "KnowledgeBase" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Conversation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TeamMember" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UsageRecord" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WebhookEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CancellationSurvey" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SupportTicket" ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. GRANT POSTGRES ROLE FULL ACCESS
-- ============================================
-- Prisma connects as the `postgres` user.
-- Without these policies, all queries return empty results.
-- ============================================

-- User
CREATE POLICY "Allow all for postgres" ON "User"
  FOR ALL TO postgres USING (true) WITH CHECK (true);

-- Subscription
CREATE POLICY "Allow all for postgres" ON "Subscription"
  FOR ALL TO postgres USING (true) WITH CHECK (true);

-- CalendarConnection
CREATE POLICY "Allow all for postgres" ON "CalendarConnection"
  FOR ALL TO postgres USING (true) WITH CHECK (true);

-- AppointmentType
CREATE POLICY "Allow all for postgres" ON "AppointmentType"
  FOR ALL TO postgres USING (true) WITH CHECK (true);

-- Availability
CREATE POLICY "Allow all for postgres" ON "Availability"
  FOR ALL TO postgres USING (true) WITH CHECK (true);

-- DateOverride
CREATE POLICY "Allow all for postgres" ON "DateOverride"
  FOR ALL TO postgres USING (true) WITH CHECK (true);

-- Appointment
CREATE POLICY "Allow all for postgres" ON "Appointment"
  FOR ALL TO postgres USING (true) WITH CHECK (true);

-- BookingFormField
CREATE POLICY "Allow all for postgres" ON "BookingFormField"
  FOR ALL TO postgres USING (true) WITH CHECK (true);

-- Form
CREATE POLICY "Allow all for postgres" ON "Form"
  FOR ALL TO postgres USING (true) WITH CHECK (true);

-- FormSubmission
CREATE POLICY "Allow all for postgres" ON "FormSubmission"
  FOR ALL TO postgres USING (true) WITH CHECK (true);

-- WidgetConfig
CREATE POLICY "Allow all for postgres" ON "WidgetConfig"
  FOR ALL TO postgres USING (true) WITH CHECK (true);

-- ChatbotConfig
CREATE POLICY "Allow all for postgres" ON "ChatbotConfig"
  FOR ALL TO postgres USING (true) WITH CHECK (true);

-- ChatbotUsage
CREATE POLICY "Allow all for postgres" ON "ChatbotUsage"
  FOR ALL TO postgres USING (true) WITH CHECK (true);

-- KnowledgeBaseCategory
CREATE POLICY "Allow all for postgres" ON "KnowledgeBaseCategory"
  FOR ALL TO postgres USING (true) WITH CHECK (true);

-- KnowledgeBase
CREATE POLICY "Allow all for postgres" ON "KnowledgeBase"
  FOR ALL TO postgres USING (true) WITH CHECK (true);

-- Conversation
CREATE POLICY "Allow all for postgres" ON "Conversation"
  FOR ALL TO postgres USING (true) WITH CHECK (true);

-- TeamMember
CREATE POLICY "Allow all for postgres" ON "TeamMember"
  FOR ALL TO postgres USING (true) WITH CHECK (true);

-- UsageRecord
CREATE POLICY "Allow all for postgres" ON "UsageRecord"
  FOR ALL TO postgres USING (true) WITH CHECK (true);

-- WebhookEvent (NEW - missing from previous scripts)
CREATE POLICY "Allow all for postgres" ON "WebhookEvent"
  FOR ALL TO postgres USING (true) WITH CHECK (true);

-- CancellationSurvey (NEW - missing from previous scripts)
CREATE POLICY "Allow all for postgres" ON "CancellationSurvey"
  FOR ALL TO postgres USING (true) WITH CHECK (true);

-- SupportTicket (NEW - missing from previous scripts)
CREATE POLICY "Allow all for postgres" ON "SupportTicket"
  FOR ALL TO postgres USING (true) WITH CHECK (true);

-- ============================================
-- VERIFICATION
-- ============================================
-- Run this after applying to verify all 21 tables have RLS:
--
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- ORDER BY tablename;
--
-- Then verify policies:
--
-- SELECT tablename, policyname
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename;
--
-- All 21 tables should have rowsecurity = true
-- and an "Allow all for postgres" policy.
-- ============================================
