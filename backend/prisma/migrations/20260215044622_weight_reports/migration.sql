/*
  Warnings:

  - A unique constraint covering the columns `[sourceId,reportDate]` on the table `t_weight_reports` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."t_weight_reports_sourceId_reportMonth_reportYear_key";

-- AlterTable
ALTER TABLE "t_weight_reports" ALTER COLUMN "reportMonth" DROP NOT NULL,
ALTER COLUMN "reportYear" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "t_weight_reports_reportDate_idx" ON "t_weight_reports"("reportDate");

-- CreateIndex
CREATE UNIQUE INDEX "t_weight_reports_sourceId_reportDate_key" ON "t_weight_reports"("sourceId", "reportDate");
