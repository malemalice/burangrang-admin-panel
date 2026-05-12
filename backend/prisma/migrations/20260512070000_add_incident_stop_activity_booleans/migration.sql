-- Add Section E checkbox booleans to incidents
-- See PRD: docs/investigation-report-prd.md Section E
-- stopActivityDescription is retained but deprecated; will be dropped in a follow-up
-- migration once the frontend stops sending it.

ALTER TABLE "t_incidents"
  ADD COLUMN "stopLocally" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "stopWholeSchool" BOOLEAN NOT NULL DEFAULT false;

-- Best-effort backfill: any incident that previously flagged needToStopActivity = YES
-- is mapped to stopLocally = true. HSE team must manually reclassify "whole school"
-- cases by reading stopActivityDescription.
UPDATE "t_incidents"
SET "stopLocally" = true
WHERE "needToStopActivity" = 'YES';
