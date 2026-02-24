-- CreateEnum
CREATE TYPE "WaterQualityLabReportStatusEnum" AS ENUM ('SCHEDULED', 'DRAFT', 'OPEN', 'WAITING_APPROVAL', 'DONE', 'REJECTED');

-- AlterTable: migrate t_water_quality_lab_reports.status from ReportStatusEnum to WaterQualityLabReportStatusEnum
ALTER TABLE "t_water_quality_lab_reports" ADD COLUMN "status_new" "WaterQualityLabReportStatusEnum";

-- Map existing values: SUBMITTED->DRAFT, RECEIVED->OPEN, UNDER_REVIEW->WAITING_APPROVAL, REVIEWED->DONE, ARCHIVED->DONE
UPDATE "t_water_quality_lab_reports" SET "status_new" = CASE
  WHEN "status"::text = 'SUBMITTED' THEN 'DRAFT'::"WaterQualityLabReportStatusEnum"
  WHEN "status"::text = 'RECEIVED' THEN 'OPEN'::"WaterQualityLabReportStatusEnum"
  WHEN "status"::text = 'UNDER_REVIEW' THEN 'WAITING_APPROVAL'::"WaterQualityLabReportStatusEnum"
  WHEN "status"::text = 'REVIEWED' THEN 'DONE'::"WaterQualityLabReportStatusEnum"
  WHEN "status"::text = 'ARCHIVED' THEN 'DONE'::"WaterQualityLabReportStatusEnum"
  ELSE 'DRAFT'::"WaterQualityLabReportStatusEnum"
END;

ALTER TABLE "t_water_quality_lab_reports" ALTER COLUMN "status_new" SET NOT NULL;
ALTER TABLE "t_water_quality_lab_reports" ALTER COLUMN "status_new" SET DEFAULT 'DRAFT';

-- Drop old index, drop old column, rename new column
DROP INDEX IF EXISTS "t_water_quality_lab_reports_status_idx";
ALTER TABLE "t_water_quality_lab_reports" DROP COLUMN "status";
ALTER TABLE "t_water_quality_lab_reports" RENAME COLUMN "status_new" TO "status";

-- Recreate index on status
CREATE INDEX "t_water_quality_lab_reports_status_idx" ON "t_water_quality_lab_reports"("status");
