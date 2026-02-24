-- CreateTable
CREATE TABLE "t_water_quality_lab_report_attachments" (
    "id" TEXT NOT NULL,
    "labReportId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "t_water_quality_lab_report_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "t_water_quality_lab_report_attachments_labReportId_idx" ON "t_water_quality_lab_report_attachments"("labReportId");

-- CreateIndex
CREATE INDEX "t_water_quality_lab_report_attachments_order_idx" ON "t_water_quality_lab_report_attachments"("order");

-- AddForeignKey
ALTER TABLE "t_water_quality_lab_report_attachments" ADD CONSTRAINT "t_water_quality_lab_report_attachments_labReportId_fkey" FOREIGN KEY ("labReportId") REFERENCES "t_water_quality_lab_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: migrate existing reportDocumentUrl into one attachment per report
INSERT INTO "t_water_quality_lab_report_attachments" ("id", "labReportId", "fileUrl", "fileName", "order", "createdAt")
SELECT gen_random_uuid(), "id", "reportDocumentUrl", 'Document', 0, NOW()
FROM "t_water_quality_lab_reports"
WHERE "reportDocumentUrl" IS NOT NULL AND "reportDocumentUrl" != '';

-- AlterTable: drop reportDocumentUrl
ALTER TABLE "t_water_quality_lab_reports" DROP COLUMN "reportDocumentUrl";
