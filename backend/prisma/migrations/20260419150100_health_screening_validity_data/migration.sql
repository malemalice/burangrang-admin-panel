-- Runs after IN_PROGRESS exists and is committed (previous migration).
UPDATE "t_health_screenings" SET "status" = 'IN_PROGRESS' WHERE "status" IS NULL;

ALTER TABLE "t_health_screenings" ALTER COLUMN "status" SET DEFAULT 'IN_PROGRESS'::"HealthScreeningStatusEnum";
ALTER TABLE "t_health_screenings" ALTER COLUMN "status" SET NOT NULL;

ALTER TABLE "t_health_screenings" DROP COLUMN IF EXISTS "validUntil";
