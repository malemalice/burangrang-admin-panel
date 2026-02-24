-- CreateEnum
CREATE TYPE "WaterQualityLabReportCategoryEnum" AS ENUM ('WASTEWATER', 'CLEAN_WATER', 'SWIMMING_POOL_WATER', 'DRINKING_WATER');

-- AlterTable
ALTER TABLE "t_water_quality_lab_reports" ADD COLUMN "category" "WaterQualityLabReportCategoryEnum" NOT NULL DEFAULT 'WASTEWATER';

-- CreateIndex
CREATE INDEX "t_water_quality_lab_reports_category_idx" ON "t_water_quality_lab_reports"("category");
