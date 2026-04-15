/*
  Warnings:

  - You are about to drop the `t_work_classification_risk_mitigations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `t_work_classification_safety_equipment` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "t_work_classification_risk_mitigations" DROP CONSTRAINT "t_work_classification_risk_mitigations_workClassificationI_fkey";

-- DropForeignKey
ALTER TABLE "t_work_classification_safety_equipment" DROP CONSTRAINT "t_work_classification_safety_equipment_safetyEquipmentId_fkey";

-- DropForeignKey
ALTER TABLE "t_work_classification_safety_equipment" DROP CONSTRAINT "t_work_classification_safety_equipment_workClassificationI_fkey";

-- DropTable
DROP TABLE "t_work_classification_risk_mitigations";

-- DropTable
DROP TABLE "t_work_classification_safety_equipment";

-- CreateTable
CREATE TABLE "t_work_classification_risk_equipment" (
    "id" TEXT NOT NULL,
    "workClassificationId" TEXT NOT NULL,
    "riskId" TEXT NOT NULL,
    "safetyEquipmentId" TEXT NOT NULL,
    "notes" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "t_work_classification_risk_equipment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "t_work_classification_risk_equipment_workClassificationId_idx" ON "t_work_classification_risk_equipment"("workClassificationId");

-- CreateIndex
CREATE UNIQUE INDEX "t_work_classification_risk_equipment_workClassificationId_r_key" ON "t_work_classification_risk_equipment"("workClassificationId", "riskId", "safetyEquipmentId");

-- AddForeignKey
ALTER TABLE "t_work_classification_risk_equipment" ADD CONSTRAINT "t_work_classification_risk_equipment_workClassificationId_fkey" FOREIGN KEY ("workClassificationId") REFERENCES "m_work_classification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_work_classification_risk_equipment" ADD CONSTRAINT "t_work_classification_risk_equipment_riskId_fkey" FOREIGN KEY ("riskId") REFERENCES "m_risk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_work_classification_risk_equipment" ADD CONSTRAINT "t_work_classification_risk_equipment_safetyEquipmentId_fkey" FOREIGN KEY ("safetyEquipmentId") REFERENCES "m_safety_equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
