-- CreateEnum
CREATE TYPE "PPEWithdrawalStatusEnum" AS ENUM ('PENDING', 'APPROVED', 'COLLECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PPEStockStatusEnum" AS ENUM ('AVAILABLE', 'RESERVED', 'ISSUED', 'EXPIRED', 'DISPOSED');

-- CreateEnum
CREATE TYPE "SafetyEquipmentCategoryEnum" AS ENUM ('PERSONAL_PROTECTIVE_EQUIPMENT', 'SAFETY_EQUIPMENT', 'EMERGENCY_EQUIPMENT');

-- CreateTable
CREATE TABLE "m_safety_equipment_type" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_safety_equipment_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_safety_equipment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "safetyEquipmentTypeId" TEXT NOT NULL,
    "size" TEXT,
    "description" TEXT,
    "category" "SafetyEquipmentCategoryEnum" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_safety_equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_ppe_stock" (
    "id" TEXT NOT NULL,
    "stockCode" TEXT NOT NULL,
    "receivedDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "t_ppe_stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_ppe_stock_items" (
    "id" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "safetyEquipmentId" TEXT,
    "equipmentName" TEXT,
    "equipmentType" TEXT,
    "equipmentSize" TEXT,
    "expiryDate" TIMESTAMP(3),
    "initialQuantity" INTEGER NOT NULL,
    "currentQuantity" INTEGER NOT NULL,
    "reservedQuantity" INTEGER NOT NULL DEFAULT 0,
    "status" "PPEStockStatusEnum" NOT NULL DEFAULT 'AVAILABLE',
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_ppe_stock_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_ppe_stock_adjustments" (
    "id" TEXT NOT NULL,
    "stockItemId" TEXT NOT NULL,
    "adjustmentType" TEXT NOT NULL,
    "quantityBefore" INTEGER NOT NULL,
    "quantityAfter" INTEGER NOT NULL,
    "quantityChange" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "adjustedBy" TEXT NOT NULL,
    "adjustedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "t_ppe_stock_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_ppe_expiry_alerts" (
    "id" TEXT NOT NULL,
    "stockItemId" TEXT NOT NULL,
    "alertDate" TIMESTAMP(3) NOT NULL,
    "daysUntilExpiry" INTEGER NOT NULL,
    "isSent" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3),
    "recipientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "t_ppe_expiry_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_ppe_withdrawals" (
    "id" TEXT NOT NULL,
    "withdrawalCode" TEXT NOT NULL,
    "withdrawalDate" TIMESTAMP(3) NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "requestedFor" TEXT,
    "requestedForName" TEXT,
    "departmentId" TEXT NOT NULL,
    "jobPositionId" TEXT,
    "jobPositionName" TEXT,
    "status" "PPEWithdrawalStatusEnum" NOT NULL DEFAULT 'PENDING',
    "withdrawalLetterUrl" TEXT,
    "collectedDate" TIMESTAMP(3),
    "collectedBy" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "t_ppe_withdrawals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_ppe_withdrawal_items" (
    "id" TEXT NOT NULL,
    "withdrawalId" TEXT NOT NULL,
    "stockItemId" TEXT NOT NULL,
    "requestedQuantity" INTEGER NOT NULL,
    "approvedQuantity" INTEGER,
    "issuedQuantity" INTEGER,
    "order" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_ppe_withdrawal_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "m_safety_equipment_type_code_key" ON "m_safety_equipment_type"("code");

-- CreateIndex
CREATE UNIQUE INDEX "m_safety_equipment_code_key" ON "m_safety_equipment"("code");

-- CreateIndex
CREATE UNIQUE INDEX "t_ppe_stock_stockCode_key" ON "t_ppe_stock"("stockCode");

-- CreateIndex
CREATE UNIQUE INDEX "t_ppe_withdrawals_withdrawalCode_key" ON "t_ppe_withdrawals"("withdrawalCode");

-- AddForeignKey
ALTER TABLE "m_safety_equipment" ADD CONSTRAINT "m_safety_equipment_safetyEquipmentTypeId_fkey" FOREIGN KEY ("safetyEquipmentTypeId") REFERENCES "m_safety_equipment_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_ppe_stock" ADD CONSTRAINT "t_ppe_stock_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "t_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_ppe_stock_items" ADD CONSTRAINT "t_ppe_stock_items_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "t_ppe_stock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_ppe_stock_items" ADD CONSTRAINT "t_ppe_stock_items_safetyEquipmentId_fkey" FOREIGN KEY ("safetyEquipmentId") REFERENCES "m_safety_equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_ppe_stock_adjustments" ADD CONSTRAINT "t_ppe_stock_adjustments_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES "t_ppe_stock_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_ppe_stock_adjustments" ADD CONSTRAINT "t_ppe_stock_adjustments_adjustedBy_fkey" FOREIGN KEY ("adjustedBy") REFERENCES "t_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_ppe_expiry_alerts" ADD CONSTRAINT "t_ppe_expiry_alerts_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES "t_ppe_stock_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_ppe_expiry_alerts" ADD CONSTRAINT "t_ppe_expiry_alerts_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "t_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_ppe_withdrawals" ADD CONSTRAINT "t_ppe_withdrawals_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "t_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_ppe_withdrawals" ADD CONSTRAINT "t_ppe_withdrawals_requestedFor_fkey" FOREIGN KEY ("requestedFor") REFERENCES "t_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_ppe_withdrawals" ADD CONSTRAINT "t_ppe_withdrawals_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "m_departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_ppe_withdrawals" ADD CONSTRAINT "t_ppe_withdrawals_jobPositionId_fkey" FOREIGN KEY ("jobPositionId") REFERENCES "m_job_positions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_ppe_withdrawals" ADD CONSTRAINT "t_ppe_withdrawals_collectedBy_fkey" FOREIGN KEY ("collectedBy") REFERENCES "t_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_ppe_withdrawals" ADD CONSTRAINT "t_ppe_withdrawals_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "t_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_ppe_withdrawal_items" ADD CONSTRAINT "t_ppe_withdrawal_items_withdrawalId_fkey" FOREIGN KEY ("withdrawalId") REFERENCES "t_ppe_withdrawals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_ppe_withdrawal_items" ADD CONSTRAINT "t_ppe_withdrawal_items_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES "t_ppe_stock_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

