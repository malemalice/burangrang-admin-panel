-- Drop legacy permit-level safety guideline (replaced by per-classification snapshots + rows)
ALTER TABLE "t_work_permits" DROP COLUMN IF EXISTS "safetyGuideline";

-- Copy-on-select TipTap HTML from master WorkClassification at time of link
ALTER TABLE "t_work_permit_classifications" ADD COLUMN "safety_guideline_snapshot" TEXT;

-- CreateTable
CREATE TABLE "t_work_permit_classification_safety_guidance_rows" (
    "id" TEXT NOT NULL,
    "workPermitClassificationId" TEXT NOT NULL,
    "riskId" TEXT NOT NULL,
    "safetyEquipmentId" TEXT NOT NULL,
    "notes" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "risk_name_snapshot" TEXT,
    "safety_equipment_name_snapshot" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "t_work_permit_classification_safety_guidance_rows_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "t_work_permit_classification_safety_guidance_rows_workPermitClassificationId_idx" ON "t_work_permit_classification_safety_guidance_rows"("workPermitClassificationId");

-- AddForeignKey
ALTER TABLE "t_work_permit_classification_safety_guidance_rows" ADD CONSTRAINT "t_work_permit_classification_safety_guidance_rows_workPermitClassificationId_fkey" FOREIGN KEY ("workPermitClassificationId") REFERENCES "t_work_permit_classifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_work_permit_classification_safety_guidance_rows" ADD CONSTRAINT "t_work_permit_classification_safety_guidance_rows_riskId_fkey" FOREIGN KEY ("riskId") REFERENCES "m_risk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_work_permit_classification_safety_guidance_rows" ADD CONSTRAINT "t_work_permit_classification_safety_guidance_rows_safetyEquipmentId_fkey" FOREIGN KEY ("safetyEquipmentId") REFERENCES "m_safety_equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
