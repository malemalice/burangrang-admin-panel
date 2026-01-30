-- CreateEnum
CREATE TYPE "IncidentClassificationEnum" AS ENUM ('MAJOR', 'MINOR', 'FATALITY');

-- CreateEnum
CREATE TYPE "SourceEnum" AS ENUM ('SYSTEM', 'ZOHO');

-- CreateEnum
CREATE TYPE "IncidentTypeEnum" AS ENUM ('NEAR_MISS', 'ACCIDENT', 'DANGEROUS_OR_HAZARDOUS_OCCURRENCE');

-- CreateEnum
CREATE TYPE "GenderEnum" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "LevelOfInjuryEnum" AS ENUM ('NOT_SPECIFIED', 'MINOR', 'MODERATE', 'SEVERE', 'FATAL');

-- CreateEnum
CREATE TYPE "InjuredBodyPartEnum" AS ENUM ('NOT_SPECIFIED', 'HEAD', 'NECK', 'ABDOMENT', 'ARM', 'FEET', 'SHOULDER', 'HAND', 'LEG', 'BACK', 'SKIN', 'CHEST', 'EYE', 'INTERNAL_ORGAN', 'OTHER');

-- CreateEnum
CREATE TYPE "TypeOfInjuryEnum" AS ENUM ('NOT_SPECIFIED', 'CUT', 'BRUISE', 'FRACTURE', 'BURN', 'SPRAIN', 'STRAIN', 'LACERATION', 'CONCUSSION', 'OTHER');

-- CreateEnum
CREATE TYPE "MechanismOfInjuryEnum" AS ENUM ('NOT_SPECIFIED', 'STRUCK_BY', 'FAILING_OBJECT', 'TRIP', 'SLIP', 'FALL', 'CHEMICAL', 'VEHICLES', 'MECHINARY', 'ELECTRICITY', 'HAND_TOOLS', 'FALL_FROM_HEIGHT', 'FLYING_OBJECT', 'OTHER');

-- CreateEnum
CREATE TYPE "StopActivityEnum" AS ENUM ('NOT_SPECIFIED', 'YES', 'NO');

-- CreateEnum
CREATE TYPE "TreatmentEnum" AS ENUM ('NOT_SPECIFIED', 'FIRST_AID', 'MEDICAL_TREATMENT', 'HOSPITALIZATION', 'NO_TREATMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "AbsenceEnum" AS ENUM ('NOT_YET_KNOWN', 'RETURNED_AFTER_TREATMENT', 'MORE_THAN_THREE_DAYS', 'NOT_SPECIFIED');

-- CreateEnum
CREATE TYPE "PriorityEnum" AS ENUM ('NOT_SPECIFIED', 'NORMAL', 'HIGH', 'VENDOR', 'LONGER_TERM');

-- CreateEnum
CREATE TYPE "HasInjuredPersonEnum" AS ENUM ('YES', 'NO');

-- CreateEnum
CREATE TYPE "HasWitnessEnum" AS ENUM ('YES', 'NO');

-- CreateTable
CREATE TABLE "t_incidents" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "incidentDate" TIMESTAMP(3) NOT NULL,
    "incidentLocation" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    "incidentType" "IncidentTypeEnum" NOT NULL,
    "incidentClassification" "IncidentClassificationEnum" NOT NULL,
    "requesterId" TEXT NOT NULL,
    "reportedBy" TEXT NOT NULL,
    "technicianId" TEXT,
    "priority" "PriorityEnum" NOT NULL DEFAULT 'NORMAL',
    "riskCategoryId" TEXT NOT NULL,
    "description" TEXT,
    "controlMeasure" TEXT,
    "dueDate" TIMESTAMP(3),
    "expectedOutcome" TEXT,
    "needToStopActivity" "StopActivityEnum" NOT NULL DEFAULT 'NOT_SPECIFIED',
    "stopActivityDescription" TEXT,
    "treatment" "TreatmentEnum" NOT NULL DEFAULT 'NOT_SPECIFIED',
    "treatmentDescription" TEXT,
    "absence" "AbsenceEnum" NOT NULL DEFAULT 'NOT_SPECIFIED',
    "resolution" TEXT,
    "assignedDepartmentId" TEXT NOT NULL,
    "assigneeId" TEXT,
    "status" "GeneralStatusEnum" NOT NULL,
    "source" "SourceEnum" NOT NULL DEFAULT 'SYSTEM',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "t_incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_incident_injured_persons" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "hasInjuredPerson" "HasInjuredPersonEnum" NOT NULL,
    "injuredPersonName" TEXT,
    "gender" "GenderEnum",
    "levelOfInjury" "LevelOfInjuryEnum" NOT NULL DEFAULT 'NOT_SPECIFIED',
    "injuredBodyPart" "InjuredBodyPartEnum" NOT NULL DEFAULT 'NOT_SPECIFIED',
    "typeOfInjury" "TypeOfInjuryEnum" NOT NULL DEFAULT 'NOT_SPECIFIED',
    "mechanismOfInjury" "MechanismOfInjuryEnum" NOT NULL DEFAULT 'NOT_SPECIFIED',
    "departmentId" TEXT,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_incident_injured_persons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_incident_witnesses" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "hasWitness" "HasWitnessEnum" NOT NULL,
    "witnessName" TEXT,
    "gender" "GenderEnum",
    "departmentId" TEXT,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_incident_witnesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_incident_assets" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "assetName" TEXT NOT NULL,
    "assetCode" TEXT,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "t_incident_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_incident_images" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "caption" TEXT,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "t_incident_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_incident_attachments" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "attachmentUrl" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "t_incident_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "t_incidents_code_key" ON "t_incidents"("code");

-- CreateIndex
CREATE INDEX "t_incidents_code_idx" ON "t_incidents"("code");

-- CreateIndex
CREATE INDEX "t_incidents_areaId_idx" ON "t_incidents"("areaId");

-- CreateIndex
CREATE INDEX "t_incidents_riskCategoryId_idx" ON "t_incidents"("riskCategoryId");

-- CreateIndex
CREATE INDEX "t_incidents_requesterId_idx" ON "t_incidents"("requesterId");

-- CreateIndex
CREATE INDEX "t_incidents_reportedBy_idx" ON "t_incidents"("reportedBy");

-- CreateIndex
CREATE INDEX "t_incidents_assignedDepartmentId_idx" ON "t_incidents"("assignedDepartmentId");

-- CreateIndex
CREATE INDEX "t_incidents_assigneeId_idx" ON "t_incidents"("assigneeId");

-- CreateIndex
CREATE INDEX "t_incidents_status_idx" ON "t_incidents"("status");

-- CreateIndex
CREATE INDEX "t_incidents_source_idx" ON "t_incidents"("source");

-- CreateIndex
CREATE INDEX "t_incident_injured_persons_incidentId_idx" ON "t_incident_injured_persons"("incidentId");

-- CreateIndex
CREATE INDEX "t_incident_injured_persons_departmentId_idx" ON "t_incident_injured_persons"("departmentId");

-- CreateIndex
CREATE INDEX "t_incident_witnesses_incidentId_idx" ON "t_incident_witnesses"("incidentId");

-- CreateIndex
CREATE INDEX "t_incident_witnesses_departmentId_idx" ON "t_incident_witnesses"("departmentId");

-- CreateIndex
CREATE INDEX "t_incident_assets_incidentId_idx" ON "t_incident_assets"("incidentId");

-- CreateIndex
CREATE INDEX "t_incident_images_incidentId_idx" ON "t_incident_images"("incidentId");

-- CreateIndex
CREATE INDEX "t_incident_images_order_idx" ON "t_incident_images"("order");

-- CreateIndex
CREATE INDEX "t_incident_attachments_incidentId_idx" ON "t_incident_attachments"("incidentId");

-- CreateIndex
CREATE INDEX "t_incident_attachments_order_idx" ON "t_incident_attachments"("order");

-- AddForeignKey
ALTER TABLE "t_incidents" ADD CONSTRAINT "t_incidents_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "m_areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_incidents" ADD CONSTRAINT "t_incidents_riskCategoryId_fkey" FOREIGN KEY ("riskCategoryId") REFERENCES "m_risk_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_incidents" ADD CONSTRAINT "t_incidents_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "t_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_incidents" ADD CONSTRAINT "t_incidents_reportedBy_fkey" FOREIGN KEY ("reportedBy") REFERENCES "t_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_incidents" ADD CONSTRAINT "t_incidents_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "t_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_incidents" ADD CONSTRAINT "t_incidents_assignedDepartmentId_fkey" FOREIGN KEY ("assignedDepartmentId") REFERENCES "m_departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_incidents" ADD CONSTRAINT "t_incidents_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "t_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_incidents" ADD CONSTRAINT "t_incidents_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "t_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_incident_injured_persons" ADD CONSTRAINT "t_incident_injured_persons_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "t_incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_incident_injured_persons" ADD CONSTRAINT "t_incident_injured_persons_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "m_departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_incident_witnesses" ADD CONSTRAINT "t_incident_witnesses_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "t_incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_incident_witnesses" ADD CONSTRAINT "t_incident_witnesses_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "m_departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_incident_assets" ADD CONSTRAINT "t_incident_assets_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "t_incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_incident_images" ADD CONSTRAINT "t_incident_images_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "t_incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_incident_attachments" ADD CONSTRAINT "t_incident_attachments_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "t_incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
