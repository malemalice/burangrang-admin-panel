-- AlterTable
ALTER TABLE "m_safety_equipment_type" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "m_safety_equipment" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "t_ppe_stock" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "t_ppe_withdrawals" ADD COLUMN "deletedAt" TIMESTAMP(3);

