-- Add encryption fields to FormSubmission
ALTER TABLE "FormSubmission" ALTER COLUMN "data" TYPE TEXT;
ALTER TABLE "FormSubmission" ADD COLUMN "dataIv" TEXT NOT NULL DEFAULT '';
ALTER TABLE "FormSubmission" ADD COLUMN "dataAuth" TEXT NOT NULL DEFAULT '';

-- Add encryption fields to CalendarConnection
ALTER TABLE "CalendarConnection" ADD COLUMN "accessTokenIv" TEXT NOT NULL DEFAULT '';
ALTER TABLE "CalendarConnection" ADD COLUMN "accessTokenAuth" TEXT NOT NULL DEFAULT '';
ALTER TABLE "CalendarConnection" ADD COLUMN "refreshTokenIv" TEXT NOT NULL DEFAULT '';
ALTER TABLE "CalendarConnection" ADD COLUMN "refreshTokenAuth" TEXT NOT NULL DEFAULT '';
