-- Single-use health declarations: bind each screening to at most one work permit.
-- Adds consumed_by_work_permit_id FK. Force-expires all currently-DONE screenings
-- so every worker starts fresh under the new rule.

ALTER TABLE "t_health_screenings"
  ADD COLUMN "consumed_by_work_permit_id" TEXT;

ALTER TABLE "t_health_screenings"
  ADD CONSTRAINT "t_health_screenings_consumed_by_work_permit_id_fkey"
  FOREIGN KEY ("consumed_by_work_permit_id")
  REFERENCES "t_work_permits"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;

CREATE INDEX "t_health_screenings_consumed_by_work_permit_id_idx"
  ON "t_health_screenings"("consumed_by_work_permit_id");

-- Data migration: force all currently-DONE declarations to EXPIRED.
-- New workflow requires a fresh declaration per work permit, so the prior
-- 90-day reuseable rows must not be auto-linked anymore.
UPDATE "t_health_screenings" SET "status" = 'EXPIRED' WHERE "status" = 'DONE';
