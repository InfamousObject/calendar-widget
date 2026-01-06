-- Add email encryption fields to CalendarConnection
ALTER TABLE "CalendarConnection" ALTER COLUMN "email" TYPE TEXT;
ALTER TABLE "CalendarConnection" ADD COLUMN "emailIv" TEXT NOT NULL DEFAULT '';
ALTER TABLE "CalendarConnection" ADD COLUMN "emailAuth" TEXT NOT NULL DEFAULT '';
