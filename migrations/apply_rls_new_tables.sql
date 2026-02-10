-- ============================================
-- RLS POLICIES FOR NEW TABLES
-- ============================================
-- Apply this to BOTH dev and production databases.
--
-- Tables: CancellationSurvey, SupportTicket
--
-- HOW TO APPLY:
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Copy and paste this entire file
-- 3. Run the query
-- ============================================

-- Enable RLS
ALTER TABLE "CancellationSurvey" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SupportTicket" ENABLE ROW LEVEL SECURITY;

-- Grant postgres role full access (required for Prisma)
CREATE POLICY "Allow all for postgres" ON "CancellationSurvey"
  FOR ALL TO postgres USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for postgres" ON "SupportTicket"
  FOR ALL TO postgres USING (true) WITH CHECK (true);

-- ============================================
-- VERIFICATION
-- ============================================
-- Run this after applying to verify:
--
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
--   AND tablename IN ('CancellationSurvey', 'SupportTicket')
-- ORDER BY tablename;
--
-- Both should have rowsecurity = true.
-- ============================================
