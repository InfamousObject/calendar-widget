-- ============================================
-- FIX RLS POLICIES FOR PRISMA
-- ============================================
--
-- The previous RLS policies only allowed 'service_role' access,
-- but Prisma connects as 'postgres' user. This fixes that.
--
-- HOW TO APPLY:
-- 1. Go to Supabase Dashboard > SQL Editor
-- 2. Copy and paste this entire file
-- 3. Run the query
--
-- ============================================

-- Drop all existing service_role policies
DROP POLICY IF EXISTS "Service role has full access to users" ON "User";
DROP POLICY IF EXISTS "Service role full access to appointments" ON "Appointment";
DROP POLICY IF EXISTS "Service role full access to appointment types" ON "AppointmentType";
DROP POLICY IF EXISTS "Service role full access to availability" ON "Availability";
DROP POLICY IF EXISTS "Service role full access to date overrides" ON "DateOverride";
DROP POLICY IF EXISTS "Service role full access to forms" ON "Form";
DROP POLICY IF EXISTS "Service role full access to form submissions" ON "FormSubmission";
DROP POLICY IF EXISTS "Service role full access to widget config" ON "WidgetConfig";
DROP POLICY IF EXISTS "Service role full access to chatbot config" ON "ChatbotConfig";
DROP POLICY IF EXISTS "Service role full access to chatbot usage" ON "ChatbotUsage";
DROP POLICY IF EXISTS "Service role full access to knowledge base" ON "KnowledgeBase";
DROP POLICY IF EXISTS "Service role full access to kb categories" ON "KnowledgeBaseCategory";
DROP POLICY IF EXISTS "Service role full access to conversations" ON "Conversation";
DROP POLICY IF EXISTS "Service role full access to subscriptions" ON "Subscription";
DROP POLICY IF EXISTS "Service role full access to team members" ON "TeamMember";
DROP POLICY IF EXISTS "Service role full access to usage records" ON "UsageRecord";
DROP POLICY IF EXISTS "Service role full access to calendar connections" ON "CalendarConnection";
DROP POLICY IF EXISTS "Service role full access to booking form fields" ON "BookingFormField";

-- Create new policies that allow postgres role (used by Prisma)
-- User Table
CREATE POLICY "Allow all for postgres" ON "User"
  FOR ALL
  TO postgres
  USING (true)
  WITH CHECK (true);

-- Appointment Table
CREATE POLICY "Allow all for postgres" ON "Appointment"
  FOR ALL
  TO postgres
  USING (true)
  WITH CHECK (true);

-- AppointmentType Table
CREATE POLICY "Allow all for postgres" ON "AppointmentType"
  FOR ALL
  TO postgres
  USING (true)
  WITH CHECK (true);

-- Availability Table
CREATE POLICY "Allow all for postgres" ON "Availability"
  FOR ALL
  TO postgres
  USING (true)
  WITH CHECK (true);

-- DateOverride Table
CREATE POLICY "Allow all for postgres" ON "DateOverride"
  FOR ALL
  TO postgres
  USING (true)
  WITH CHECK (true);

-- Form Table
CREATE POLICY "Allow all for postgres" ON "Form"
  FOR ALL
  TO postgres
  USING (true)
  WITH CHECK (true);

-- FormSubmission Table
CREATE POLICY "Allow all for postgres" ON "FormSubmission"
  FOR ALL
  TO postgres
  USING (true)
  WITH CHECK (true);

-- WidgetConfig Table
CREATE POLICY "Allow all for postgres" ON "WidgetConfig"
  FOR ALL
  TO postgres
  USING (true)
  WITH CHECK (true);

-- ChatbotConfig Table
CREATE POLICY "Allow all for postgres" ON "ChatbotConfig"
  FOR ALL
  TO postgres
  USING (true)
  WITH CHECK (true);

-- ChatbotUsage Table
CREATE POLICY "Allow all for postgres" ON "ChatbotUsage"
  FOR ALL
  TO postgres
  USING (true)
  WITH CHECK (true);

-- KnowledgeBase Table
CREATE POLICY "Allow all for postgres" ON "KnowledgeBase"
  FOR ALL
  TO postgres
  USING (true)
  WITH CHECK (true);

-- KnowledgeBaseCategory Table
CREATE POLICY "Allow all for postgres" ON "KnowledgeBaseCategory"
  FOR ALL
  TO postgres
  USING (true)
  WITH CHECK (true);

-- Conversation Table
CREATE POLICY "Allow all for postgres" ON "Conversation"
  FOR ALL
  TO postgres
  USING (true)
  WITH CHECK (true);

-- Subscription Table
CREATE POLICY "Allow all for postgres" ON "Subscription"
  FOR ALL
  TO postgres
  USING (true)
  WITH CHECK (true);

-- TeamMember Table
CREATE POLICY "Allow all for postgres" ON "TeamMember"
  FOR ALL
  TO postgres
  USING (true)
  WITH CHECK (true);

-- UsageRecord Table
CREATE POLICY "Allow all for postgres" ON "UsageRecord"
  FOR ALL
  TO postgres
  USING (true)
  WITH CHECK (true);

-- CalendarConnection Table
CREATE POLICY "Allow all for postgres" ON "CalendarConnection"
  FOR ALL
  TO postgres
  USING (true)
  WITH CHECK (true);

-- BookingFormField Table
CREATE POLICY "Allow all for postgres" ON "BookingFormField"
  FOR ALL
  TO postgres
  USING (true)
  WITH CHECK (true);

-- ============================================
-- VERIFICATION
-- ============================================
-- Verify policies are created correctly:
--
-- SELECT tablename, policyname
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename;
--
-- All tables should have "Allow all for postgres" policy
-- ============================================
