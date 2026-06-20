-- CreateEnum
CREATE TYPE "InvestigationStatusEnum" AS ENUM ('DRAFT', 'COMPLETE');

-- CreateEnum
CREATE TYPE "InvestigationCauseSectionEnum" AS ENUM ('LATENT_FAILURE', 'ACTIVE_FAILURE');

-- CreateEnum
CREATE TYPE "InvestigationSignatoryRoleEnum" AS ENUM ('LEAD_INVESTIGATOR', 'INVESTIGATOR_2', 'INVESTIGATOR_3', 'RELATED_MANAGER', 'SECURITY');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "MechanismOfInjuryEnum" ADD VALUE 'SHARP_OBJECTS';
ALTER TYPE "MechanismOfInjuryEnum" ADD VALUE 'HEAT_COLD';
ALTER TYPE "MechanismOfInjuryEnum" ADD VALUE 'MANUAL_HANDLING';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TreatmentEnum" ADD VALUE 'SELF';
ALTER TYPE "TreatmentEnum" ADD VALUE 'HEALTH_SERVICES';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TypeOfInjuryEnum" ADD VALUE 'DERMATITIS';
ALTER TYPE "TypeOfInjuryEnum" ADD VALUE 'PARALYSIS';
ALTER TYPE "TypeOfInjuryEnum" ADD VALUE 'AMPUTATION';
ALTER TYPE "TypeOfInjuryEnum" ADD VALUE 'CRUSH';
ALTER TYPE "TypeOfInjuryEnum" ADD VALUE 'ABRASION';

-- AlterTable
ALTER TABLE "t_incident_injured_persons" ADD COLUMN     "position" VARCHAR(255);

-- AlterTable
ALTER TABLE "t_incident_witnesses" ADD COLUMN     "position" VARCHAR(255);

-- AlterTable
ALTER TABLE "t_incidents" ADD COLUMN     "needFurtherInvestigation" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "t_investigation_reports" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "reportNumber" TEXT NOT NULL,
    "taskBeingPerformed" TEXT,
    "equipmentUsed" TEXT,
    "status" "InvestigationStatusEnum" NOT NULL DEFAULT 'DRAFT',
    "hsComments" TEXT,
    "hsCommentSignedBy" TEXT,
    "hsCommentSignedAt" TIMESTAMP(3),
    "distributionSafetyCommittee" BOOLEAN NOT NULL DEFAULT false,
    "distributionHeadOfBusinessOp" BOOLEAN NOT NULL DEFAULT false,
    "distributionRelatedDepartment" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_investigation_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_investigation_costs" (
    "id" TEXT NOT NULL,
    "investigationReportId" TEXT NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'IDR',
    "medicalCost" DECIMAL(15,2),
    "lostTimeCost" DECIMAL(15,2),
    "damageCost" DECIMAL(15,2),
    "repairCost" DECIMAL(15,2),
    "compensationCost" DECIMAL(15,2),
    "otherCost" DECIMAL(15,2),
    "isNotYetKnown" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_investigation_costs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_investigation_causes" (
    "id" TEXT NOT NULL,
    "investigationReportId" TEXT NOT NULL,
    "section" "InvestigationCauseSectionEnum" NOT NULL,
    "tier1" VARCHAR(64) NOT NULL,
    "tier2" VARCHAR(64) NOT NULL,
    "causeKey" VARCHAR(16) NOT NULL,
    "causeName" VARCHAR(256) NOT NULL,
    "isSelected" BOOLEAN NOT NULL DEFAULT true,
    "customNotes" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_investigation_causes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_investigation_action_plans" (
    "id" TEXT NOT NULL,
    "investigationReportId" TEXT NOT NULL,
    "actionPlan" TEXT NOT NULL,
    "responsiblePerson" VARCHAR(512),
    "targetDate" TIMESTAMP(3),
    "targetDateNotes" TEXT,
    "verificationDate" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_investigation_action_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_investigation_signatories" (
    "id" TEXT NOT NULL,
    "investigationReportId" TEXT NOT NULL,
    "signatoryRole" "InvestigationSignatoryRoleEnum" NOT NULL,
    "roleName" VARCHAR(128),
    "name" VARCHAR(256),
    "signatureUrl" VARCHAR(512),
    "signedAt" TIMESTAMP(3),
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_investigation_signatories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "t_investigation_reports_incidentId_key" ON "t_investigation_reports"("incidentId");

-- CreateIndex
CREATE UNIQUE INDEX "t_investigation_reports_reportNumber_key" ON "t_investigation_reports"("reportNumber");

-- CreateIndex
CREATE INDEX "t_investigation_reports_status_idx" ON "t_investigation_reports"("status");

-- CreateIndex
CREATE INDEX "t_investigation_reports_createdAt_idx" ON "t_investigation_reports"("createdAt");

-- CreateIndex
CREATE INDEX "t_investigation_reports_isActive_idx" ON "t_investigation_reports"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "t_investigation_costs_investigationReportId_key" ON "t_investigation_costs"("investigationReportId");

-- CreateIndex
CREATE INDEX "t_investigation_causes_investigationReportId_idx" ON "t_investigation_causes"("investigationReportId");

-- CreateIndex
CREATE INDEX "t_investigation_causes_investigationReportId_section_idx" ON "t_investigation_causes"("investigationReportId", "section");

-- CreateIndex
CREATE INDEX "t_investigation_causes_isSelected_idx" ON "t_investigation_causes"("isSelected");

-- CreateIndex
CREATE UNIQUE INDEX "t_investigation_causes_investigationReportId_causeKey_key" ON "t_investigation_causes"("investigationReportId", "causeKey");

-- CreateIndex
CREATE INDEX "t_investigation_action_plans_investigationReportId_idx" ON "t_investigation_action_plans"("investigationReportId");

-- CreateIndex
CREATE INDEX "t_investigation_action_plans_investigationReportId_order_idx" ON "t_investigation_action_plans"("investigationReportId", "order");

-- CreateIndex
CREATE INDEX "t_investigation_action_plans_verifiedBy_idx" ON "t_investigation_action_plans"("verifiedBy");

-- CreateIndex
CREATE INDEX "t_investigation_action_plans_targetDate_idx" ON "t_investigation_action_plans"("targetDate");

-- CreateIndex
CREATE INDEX "t_investigation_signatories_investigationReportId_idx" ON "t_investigation_signatories"("investigationReportId");

-- CreateIndex
CREATE UNIQUE INDEX "t_investigation_signatories_investigationReportId_signatory_key" ON "t_investigation_signatories"("investigationReportId", "signatoryRole");

-- AddForeignKey
ALTER TABLE "t_investigation_reports" ADD CONSTRAINT "t_investigation_reports_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "t_incidents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_investigation_reports" ADD CONSTRAINT "t_investigation_reports_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "t_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_investigation_reports" ADD CONSTRAINT "t_investigation_reports_hsCommentSignedBy_fkey" FOREIGN KEY ("hsCommentSignedBy") REFERENCES "t_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_investigation_costs" ADD CONSTRAINT "t_investigation_costs_investigationReportId_fkey" FOREIGN KEY ("investigationReportId") REFERENCES "t_investigation_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_investigation_causes" ADD CONSTRAINT "t_investigation_causes_investigationReportId_fkey" FOREIGN KEY ("investigationReportId") REFERENCES "t_investigation_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_investigation_action_plans" ADD CONSTRAINT "t_investigation_action_plans_investigationReportId_fkey" FOREIGN KEY ("investigationReportId") REFERENCES "t_investigation_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_investigation_action_plans" ADD CONSTRAINT "t_investigation_action_plans_verifiedBy_fkey" FOREIGN KEY ("verifiedBy") REFERENCES "t_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_investigation_signatories" ADD CONSTRAINT "t_investigation_signatories_investigationReportId_fkey" FOREIGN KEY ("investigationReportId") REFERENCES "t_investigation_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
