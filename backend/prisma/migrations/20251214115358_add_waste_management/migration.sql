-- CreateEnum
CREATE TYPE "WasteTypeEnum" AS ENUM ('DOMESTIC', 'HAZARDOUS', 'FOOD', 'GREEN');

-- CreateEnum
CREATE TYPE "ReportStatusEnum" AS ENUM ('SUBMITTED', 'RECEIVED', 'UNDER_REVIEW', 'REVIEWED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MonthEnum" AS ENUM ('JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC');

-- CreateEnum
CREATE TYPE "GeneralStatusEnum" AS ENUM ('SCHEDULED', 'DRAFT', 'OPEN', 'WAITING_APPROVAL', 'DONE', 'REJECTED');

-- CreateTable
CREATE TABLE "m_treatment_plants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "capacity" DECIMAL(12,4),
    "description" TEXT,
    "officeId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "m_treatment_plants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_water_quality_parameters" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "standardLimit" DECIMAL(10,4),
    "regulatoryLimit" DECIMAL(10,4),
    "testMethod" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_water_quality_parameters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_monthly_flow_reports" (
    "id" TEXT NOT NULL,
    "reportCode" TEXT NOT NULL,
    "treatmentPlantId" TEXT NOT NULL,
    "reportMonth" "MonthEnum" NOT NULL,
    "reportYear" INTEGER NOT NULL,
    "totalVolume" DECIMAL(12,4) NOT NULL,
    "averageDailyFlow" DECIMAL(10,4) NOT NULL,
    "peakFlow" DECIMAL(10,4),
    "minimumFlow" DECIMAL(10,4),
    "reportDocumentUrl" TEXT,
    "submittedBy" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL,
    "receivedBy" TEXT,
    "receivedAt" TIMESTAMP(3),
    "status" "ReportStatusEnum" NOT NULL DEFAULT 'SUBMITTED',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "archivedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_monthly_flow_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_water_quality_lab_reports" (
    "id" TEXT NOT NULL,
    "reportCode" TEXT NOT NULL,
    "treatmentPlantId" TEXT NOT NULL,
    "reportDate" TIMESTAMP(3) NOT NULL,
    "preparedBy" TEXT NOT NULL,
    "reportDocumentUrl" TEXT,
    "summary" TEXT,
    "recommendations" TEXT,
    "analystSignature" TEXT,
    "submittedBy" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL,
    "receivedBy" TEXT,
    "receivedAt" TIMESTAMP(3),
    "status" "ReportStatusEnum" NOT NULL DEFAULT 'SUBMITTED',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "archivedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_water_quality_lab_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_waste_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "wasteType" "WasteTypeEnum" NOT NULL,
    "description" TEXT,
    "requiresSpecialHandling" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_waste_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_waste_sources" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "description" TEXT,
    "contactPerson" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_waste_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_storage_locations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "areaId" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "m_storage_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_weight_reports" (
    "id" TEXT NOT NULL,
    "reportCode" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "storageLocationId" TEXT NOT NULL,
    "reportDate" TIMESTAMP(3) NOT NULL,
    "reportMonth" "MonthEnum" NOT NULL,
    "reportYear" INTEGER NOT NULL,
    "reportDocumentUrl" TEXT,
    "submittedBy" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL,
    "receivedBy" TEXT,
    "receivedAt" TIMESTAMP(3),
    "status" "ReportStatusEnum" NOT NULL DEFAULT 'SUBMITTED',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "archivedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_weight_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_weight_report_items" (
    "id" TEXT NOT NULL,
    "weightReportId" TEXT NOT NULL,
    "wasteTypeId" TEXT NOT NULL,
    "weight" DECIMAL(10,2) NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'kg',
    "order" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_weight_report_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_dispatch_orders" (
    "id" TEXT NOT NULL,
    "dispatchCode" TEXT NOT NULL,
    "dispatchDate" TIMESTAMP(3) NOT NULL,
    "orderedBy" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "memo" TEXT,
    "status" "GeneralStatusEnum" NOT NULL DEFAULT 'DRAFT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "t_dispatch_orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "m_treatment_plants_code_key" ON "m_treatment_plants"("code");

-- CreateIndex
CREATE UNIQUE INDEX "m_water_quality_parameters_code_key" ON "m_water_quality_parameters"("code");

-- CreateIndex
CREATE UNIQUE INDEX "t_monthly_flow_reports_reportCode_key" ON "t_monthly_flow_reports"("reportCode");

-- CreateIndex
CREATE INDEX "t_monthly_flow_reports_reportMonth_reportYear_idx" ON "t_monthly_flow_reports"("reportMonth", "reportYear");

-- CreateIndex
CREATE INDEX "t_monthly_flow_reports_status_idx" ON "t_monthly_flow_reports"("status");

-- CreateIndex
CREATE INDEX "t_monthly_flow_reports_receivedAt_idx" ON "t_monthly_flow_reports"("receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "t_monthly_flow_reports_treatmentPlantId_reportMonth_reportY_key" ON "t_monthly_flow_reports"("treatmentPlantId", "reportMonth", "reportYear");

-- CreateIndex
CREATE UNIQUE INDEX "t_water_quality_lab_reports_reportCode_key" ON "t_water_quality_lab_reports"("reportCode");

-- CreateIndex
CREATE INDEX "t_water_quality_lab_reports_treatmentPlantId_reportDate_idx" ON "t_water_quality_lab_reports"("treatmentPlantId", "reportDate");

-- CreateIndex
CREATE INDEX "t_water_quality_lab_reports_reportDate_idx" ON "t_water_quality_lab_reports"("reportDate");

-- CreateIndex
CREATE INDEX "t_water_quality_lab_reports_status_idx" ON "t_water_quality_lab_reports"("status");

-- CreateIndex
CREATE INDEX "t_water_quality_lab_reports_receivedAt_idx" ON "t_water_quality_lab_reports"("receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "m_waste_types_code_key" ON "m_waste_types"("code");

-- CreateIndex
CREATE UNIQUE INDEX "m_waste_sources_code_key" ON "m_waste_sources"("code");

-- CreateIndex
CREATE UNIQUE INDEX "m_storage_locations_code_key" ON "m_storage_locations"("code");

-- CreateIndex
CREATE UNIQUE INDEX "t_weight_reports_reportCode_key" ON "t_weight_reports"("reportCode");

-- CreateIndex
CREATE INDEX "t_weight_reports_reportMonth_reportYear_idx" ON "t_weight_reports"("reportMonth", "reportYear");

-- CreateIndex
CREATE INDEX "t_weight_reports_status_idx" ON "t_weight_reports"("status");

-- CreateIndex
CREATE INDEX "t_weight_reports_receivedAt_idx" ON "t_weight_reports"("receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "t_weight_reports_sourceId_reportMonth_reportYear_key" ON "t_weight_reports"("sourceId", "reportMonth", "reportYear");

-- CreateIndex
CREATE UNIQUE INDEX "t_weight_report_items_weightReportId_wasteTypeId_key" ON "t_weight_report_items"("weightReportId", "wasteTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "t_dispatch_orders_dispatchCode_key" ON "t_dispatch_orders"("dispatchCode");

-- CreateIndex
CREATE INDEX "t_dispatch_orders_dispatchDate_idx" ON "t_dispatch_orders"("dispatchDate");

-- CreateIndex
CREATE INDEX "t_dispatch_orders_orderedBy_idx" ON "t_dispatch_orders"("orderedBy");

-- CreateIndex
CREATE INDEX "t_dispatch_orders_status_idx" ON "t_dispatch_orders"("status");

-- AddForeignKey
ALTER TABLE "m_treatment_plants" ADD CONSTRAINT "m_treatment_plants_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "m_offices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_treatment_plants" ADD CONSTRAINT "m_treatment_plants_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "t_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_monthly_flow_reports" ADD CONSTRAINT "t_monthly_flow_reports_treatmentPlantId_fkey" FOREIGN KEY ("treatmentPlantId") REFERENCES "m_treatment_plants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_monthly_flow_reports" ADD CONSTRAINT "t_monthly_flow_reports_submittedBy_fkey" FOREIGN KEY ("submittedBy") REFERENCES "t_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_monthly_flow_reports" ADD CONSTRAINT "t_monthly_flow_reports_receivedBy_fkey" FOREIGN KEY ("receivedBy") REFERENCES "t_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_monthly_flow_reports" ADD CONSTRAINT "t_monthly_flow_reports_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "t_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_water_quality_lab_reports" ADD CONSTRAINT "t_water_quality_lab_reports_treatmentPlantId_fkey" FOREIGN KEY ("treatmentPlantId") REFERENCES "m_treatment_plants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_water_quality_lab_reports" ADD CONSTRAINT "t_water_quality_lab_reports_preparedBy_fkey" FOREIGN KEY ("preparedBy") REFERENCES "t_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_water_quality_lab_reports" ADD CONSTRAINT "t_water_quality_lab_reports_submittedBy_fkey" FOREIGN KEY ("submittedBy") REFERENCES "t_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_water_quality_lab_reports" ADD CONSTRAINT "t_water_quality_lab_reports_receivedBy_fkey" FOREIGN KEY ("receivedBy") REFERENCES "t_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_water_quality_lab_reports" ADD CONSTRAINT "t_water_quality_lab_reports_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "t_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_storage_locations" ADD CONSTRAINT "m_storage_locations_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "m_areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_storage_locations" ADD CONSTRAINT "m_storage_locations_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "t_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_weight_reports" ADD CONSTRAINT "t_weight_reports_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "m_waste_sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_weight_reports" ADD CONSTRAINT "t_weight_reports_storageLocationId_fkey" FOREIGN KEY ("storageLocationId") REFERENCES "m_storage_locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_weight_reports" ADD CONSTRAINT "t_weight_reports_submittedBy_fkey" FOREIGN KEY ("submittedBy") REFERENCES "t_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_weight_reports" ADD CONSTRAINT "t_weight_reports_receivedBy_fkey" FOREIGN KEY ("receivedBy") REFERENCES "t_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_weight_reports" ADD CONSTRAINT "t_weight_reports_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "t_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_weight_report_items" ADD CONSTRAINT "t_weight_report_items_weightReportId_fkey" FOREIGN KEY ("weightReportId") REFERENCES "t_weight_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_weight_report_items" ADD CONSTRAINT "t_weight_report_items_wasteTypeId_fkey" FOREIGN KEY ("wasteTypeId") REFERENCES "m_waste_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_dispatch_orders" ADD CONSTRAINT "t_dispatch_orders_orderedBy_fkey" FOREIGN KEY ("orderedBy") REFERENCES "t_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_dispatch_orders" ADD CONSTRAINT "t_dispatch_orders_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "t_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
