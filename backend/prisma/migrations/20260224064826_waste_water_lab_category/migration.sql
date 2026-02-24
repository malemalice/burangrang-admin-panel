-- CreateEnum
CREATE TYPE "WaterQualityParameterCategoryEnum" AS ENUM ('CHEMISTRY', 'PHYSICS', 'MICROBIOLOGY');

-- AlterTable
ALTER TABLE "m_water_quality_parameters" ADD COLUMN     "category" "WaterQualityParameterCategoryEnum" NOT NULL DEFAULT 'CHEMISTRY',
ADD COLUMN     "displayOrder" INTEGER;

-- CreateTable
CREATE TABLE "t_water_quality_lab_report_results" (
    "id" TEXT NOT NULL,
    "labReportId" TEXT NOT NULL,
    "parameterId" TEXT NOT NULL,
    "resultValue" DECIMAL(12,4) NOT NULL,
    "unit" TEXT,
    "isCompliant" BOOLEAN,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_water_quality_lab_report_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "t_water_quality_lab_report_results_labReportId_idx" ON "t_water_quality_lab_report_results"("labReportId");

-- CreateIndex
CREATE INDEX "t_water_quality_lab_report_results_parameterId_idx" ON "t_water_quality_lab_report_results"("parameterId");

-- CreateIndex
CREATE UNIQUE INDEX "t_water_quality_lab_report_results_labReportId_parameterId_key" ON "t_water_quality_lab_report_results"("labReportId", "parameterId");

-- CreateIndex
CREATE INDEX "m_water_quality_parameters_category_idx" ON "m_water_quality_parameters"("category");

-- CreateIndex
CREATE INDEX "m_water_quality_parameters_displayOrder_idx" ON "m_water_quality_parameters"("displayOrder");

-- AddForeignKey
ALTER TABLE "t_water_quality_lab_report_results" ADD CONSTRAINT "t_water_quality_lab_report_results_labReportId_fkey" FOREIGN KEY ("labReportId") REFERENCES "t_water_quality_lab_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_water_quality_lab_report_results" ADD CONSTRAINT "t_water_quality_lab_report_results_parameterId_fkey" FOREIGN KEY ("parameterId") REFERENCES "m_water_quality_parameters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
