-- CreateEnum
CREATE TYPE "WeightReportStatusEnum" AS ENUM ('SCHEDULED', 'DRAFT', 'OPEN', 'WAITING_APPROVAL', 'DONE', 'REJECTED');

-- AlterTable: migrate t_weight_reports.status from ReportStatusEnum to WeightReportStatusEnum
ALTER TABLE "t_weight_reports" ADD COLUMN "status_new" "WeightReportStatusEnum";

-- Map existing values: SUBMITTED->DRAFT, RECEIVED->OPEN, UNDER_REVIEW->WAITING_APPROVAL, REVIEWED->DONE, ARCHIVED->DONE
UPDATE "t_weight_reports" SET "status_new" = CASE
  WHEN "status"::text = 'SUBMITTED' THEN 'DRAFT'::"WeightReportStatusEnum"
  WHEN "status"::text = 'RECEIVED' THEN 'OPEN'::"WeightReportStatusEnum"
  WHEN "status"::text = 'UNDER_REVIEW' THEN 'WAITING_APPROVAL'::"WeightReportStatusEnum"
  WHEN "status"::text = 'REVIEWED' THEN 'DONE'::"WeightReportStatusEnum"
  WHEN "status"::text = 'ARCHIVED' THEN 'DONE'::"WeightReportStatusEnum"
  ELSE 'DRAFT'::"WeightReportStatusEnum"
END;

ALTER TABLE "t_weight_reports" ALTER COLUMN "status_new" SET NOT NULL;
ALTER TABLE "t_weight_reports" ALTER COLUMN "status_new" SET DEFAULT 'DRAFT';

-- Drop old index, drop old column, rename new column
DROP INDEX IF EXISTS "t_weight_reports_status_idx";
ALTER TABLE "t_weight_reports" DROP COLUMN "status";
ALTER TABLE "t_weight_reports" RENAME COLUMN "status_new" TO "status";

-- Recreate index on status
CREATE INDEX "t_weight_reports_status_idx" ON "t_weight_reports"("status");
