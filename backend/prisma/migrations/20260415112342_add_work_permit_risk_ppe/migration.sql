-- CreateTable
CREATE TABLE "t_work_classification_risk_mitigations" (
    "id" TEXT NOT NULL,
    "workClassificationId" TEXT NOT NULL,
    "hazard" TEXT NOT NULL,
    "mitigation" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "t_work_classification_risk_mitigations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_work_classification_safety_equipment" (
    "id" TEXT NOT NULL,
    "workClassificationId" TEXT NOT NULL,
    "safetyEquipmentId" TEXT NOT NULL,
    "notes" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "t_work_classification_safety_equipment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "t_work_classification_risk_mitigations_workClassificationId_idx" ON "t_work_classification_risk_mitigations"("workClassificationId");

-- CreateIndex
CREATE INDEX "t_work_classification_safety_equipment_workClassificationId_idx" ON "t_work_classification_safety_equipment"("workClassificationId");

-- CreateIndex
CREATE UNIQUE INDEX "t_work_classification_safety_equipment_workClassificationId_key" ON "t_work_classification_safety_equipment"("workClassificationId", "safetyEquipmentId");

-- AddForeignKey
ALTER TABLE "t_work_classification_risk_mitigations" ADD CONSTRAINT "t_work_classification_risk_mitigations_workClassificationI_fkey" FOREIGN KEY ("workClassificationId") REFERENCES "m_work_classification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_work_classification_safety_equipment" ADD CONSTRAINT "t_work_classification_safety_equipment_workClassificationI_fkey" FOREIGN KEY ("workClassificationId") REFERENCES "m_work_classification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_work_classification_safety_equipment" ADD CONSTRAINT "t_work_classification_safety_equipment_safetyEquipmentId_fkey" FOREIGN KEY ("safetyEquipmentId") REFERENCES "m_safety_equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
