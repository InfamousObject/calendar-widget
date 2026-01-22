-- Add Google Meet integration fields

-- Add enableGoogleMeet to AppointmentType
ALTER TABLE "AppointmentType" ADD COLUMN IF NOT EXISTS "enableGoogleMeet" BOOLEAN NOT NULL DEFAULT false;

-- Add meeting link fields to Appointment
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "meetingLink" TEXT;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "meetingProvider" TEXT;

-- Add comment for documentation
COMMENT ON COLUMN "AppointmentType"."enableGoogleMeet" IS 'Auto-generate Google Meet link when booking appointments of this type';
COMMENT ON COLUMN "Appointment"."meetingLink" IS 'Video conferencing link (Google Meet, Zoom, etc.)';
COMMENT ON COLUMN "Appointment"."meetingProvider" IS 'Video conferencing provider: google_meet, zoom, etc.';
