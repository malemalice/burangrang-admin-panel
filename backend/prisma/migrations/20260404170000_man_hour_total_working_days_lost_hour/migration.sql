-- AlterTable: add columns with defaults so existing rows remain valid
ALTER TABLE "t_man_hours" ADD COLUMN "totalWorkingDays" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "t_man_hours" ADD COLUMN "lostHour" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- Backfill totalWorkingDays = qty * manHourPerDay * 22 (application formula)
UPDATE "t_man_hours"
SET "totalWorkingDays" = ("qty"::numeric * "manHourPerDay" * 22);

-- Legacy rows: lost hour = gap between theoretical total and stored total; then align total
UPDATE "t_man_hours"
SET "lostHour" = GREATEST(0::numeric, "totalWorkingDays" - "total");

UPDATE "t_man_hours"
SET "total" = "totalWorkingDays" - "lostHour";
