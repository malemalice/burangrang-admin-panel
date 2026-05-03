-- CreateEnum
CREATE TYPE "InspectionRiskRateEnum" AS ENUM ('SAFE', 'LOW_HAZARD', 'MODERATE_HAZARD', 'CRITICAL_HAZARD');

-- AlterTable
ALTER TABLE "t_inspection_items" ADD COLUMN     "checklistId" TEXT;

-- CreateTable
CREATE TABLE "m_inspection_checklists" (
    "id" TEXT NOT NULL,
    "parentId" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_inspection_checklists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_inspection_checklist_results" (
    "id" TEXT NOT NULL,
    "inspectionItemId" TEXT NOT NULL,
    "checklistItemId" TEXT NOT NULL,
    "riskRate" "InspectionRiskRateEnum",
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "t_inspection_checklist_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "m_inspection_checklists_code_idx" ON "m_inspection_checklists"("code");

-- CreateIndex
CREATE INDEX "m_inspection_checklists_parentId_idx" ON "m_inspection_checklists"("parentId");

-- CreateIndex
CREATE INDEX "m_inspection_checklists_parentId_order_idx" ON "m_inspection_checklists"("parentId", "order");

-- CreateIndex
CREATE INDEX "t_inspection_checklist_results_inspectionItemId_idx" ON "t_inspection_checklist_results"("inspectionItemId");

-- CreateIndex
CREATE INDEX "t_inspection_checklist_results_checklistItemId_idx" ON "t_inspection_checklist_results"("checklistItemId");

-- CreateIndex
CREATE INDEX "t_inspection_checklist_results_riskRate_idx" ON "t_inspection_checklist_results"("riskRate");

-- CreateIndex
CREATE UNIQUE INDEX "t_inspection_checklist_results_inspectionItemId_checklistIt_key" ON "t_inspection_checklist_results"("inspectionItemId", "checklistItemId");

-- CreateIndex
CREATE INDEX "t_inspection_items_checklistId_idx" ON "t_inspection_items"("checklistId");

-- AddForeignKey
ALTER TABLE "m_inspection_checklists" ADD CONSTRAINT "m_inspection_checklists_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "m_inspection_checklists"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_inspection_items" ADD CONSTRAINT "t_inspection_items_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES "m_inspection_checklists"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_inspection_checklist_results" ADD CONSTRAINT "t_inspection_checklist_results_inspectionItemId_fkey" FOREIGN KEY ("inspectionItemId") REFERENCES "t_inspection_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_inspection_checklist_results" ADD CONSTRAINT "t_inspection_checklist_results_checklistItemId_fkey" FOREIGN KEY ("checklistItemId") REFERENCES "m_inspection_checklists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_inspection_checklist_results" ADD CONSTRAINT "t_inspection_checklist_results_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "t_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
