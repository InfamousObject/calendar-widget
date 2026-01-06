-- ============================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================
--
-- IMPORTANT: This migration enables RLS on all tables to prevent
-- unauthorized database access. After enabling RLS, only the
-- service role (used by your Next.js API) will have full access.
--
-- HOW TO APPLY:
-- 1. Go to your Supabase Dashboard
-- 2. Navigate to SQL Editor
-- 3. Create a new query
-- 4. Copy and paste this entire file
-- 5. Run the query
-- 6. Verify in Database > Tables that "RLS enabled" badge appears
--
-- ============================================

-- User Table
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to users" ON "User"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================

-- Appointment Table
ALTER TABLE "Appointment" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to appointments" ON "Appointment"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================

-- AppointmentType Table
ALTER TABLE "AppointmentType" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to appointment types" ON "AppointmentType"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================

-- Availability Table
ALTER TABLE "Availability" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to availability" ON "Availability"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================

-- DateOverride Table
ALTER TABLE "DateOverride" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to date overrides" ON "DateOverride"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================

-- Form Table
ALTER TABLE "Form" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to forms" ON "Form"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================

-- FormSubmission Table
ALTER TABLE "FormSubmission" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to form submissions" ON "FormSubmission"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================

-- WidgetConfig Table
ALTER TABLE "WidgetConfig" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to widget config" ON "WidgetConfig"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================

-- ChatbotConfig Table
ALTER TABLE "ChatbotConfig" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to chatbot config" ON "ChatbotConfig"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================

-- ChatbotUsage Table
ALTER TABLE "ChatbotUsage" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to chatbot usage" ON "ChatbotUsage"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================

-- KnowledgeBase Table
ALTER TABLE "KnowledgeBase" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to knowledge base" ON "KnowledgeBase"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================

-- KnowledgeBaseCategory Table
ALTER TABLE "KnowledgeBaseCategory" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to kb categories" ON "KnowledgeBaseCategory"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================

-- Conversation Table
ALTER TABLE "Conversation" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to conversations" ON "Conversation"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================

-- Subscription Table
ALTER TABLE "Subscription" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to subscriptions" ON "Subscription"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================

-- TeamMember Table
ALTER TABLE "TeamMember" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to team members" ON "TeamMember"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================

-- UsageRecord Table
ALTER TABLE "UsageRecord" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to usage records" ON "UsageRecord"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================

-- CalendarConnection Table
ALTER TABLE "CalendarConnection" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to calendar connections" ON "CalendarConnection"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================

-- BookingFormField Table
ALTER TABLE "BookingFormField" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to booking form fields" ON "BookingFormField"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- VERIFICATION
-- ============================================
-- After running this migration, verify RLS is enabled:
--
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- AND tablename IN (
--   'User', 'Appointment', 'AppointmentType', 'Availability',
--   'DateOverride', 'Form', 'FormSubmission', 'WidgetConfig',
--   'ChatbotConfig', 'ChatbotUsage', 'KnowledgeBase',
--   'KnowledgeBaseCategory', 'Conversation', 'Subscription',
--   'TeamMember', 'UsageRecord', 'CalendarConnection',
--   'BookingFormField'
-- );
--
-- All tables should have rowsecurity = true
-- ============================================
