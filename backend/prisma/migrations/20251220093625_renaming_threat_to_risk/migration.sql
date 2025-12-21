/*
  Warnings:

  - You are about to drop the `m_threats` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."m_threat_mitigations" DROP CONSTRAINT "m_threat_mitigations_threatId_fkey";

-- DropForeignKey
ALTER TABLE "public"."m_threats" DROP CONSTRAINT "m_threats_hseCategoryId_fkey";

-- DropForeignKey
ALTER TABLE "public"."t_risk_assessment_item" DROP CONSTRAINT "t_risk_assessment_item_mThreatId_fkey";

-- DropForeignKey
ALTER TABLE "public"."t_work_permit_hazards" DROP CONSTRAINT "t_work_permit_hazards_hazardId_fkey";

-- AlterTable
ALTER TABLE "m_risk_matrix" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- DropTable
DROP TABLE "public"."m_threats";

-- CreateTable
CREATE TABLE "m_risk" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "hseCategoryId" TEXT NOT NULL,

    CONSTRAINT "m_risk_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "m_risk_code_key" ON "m_risk"("code");

-- AddForeignKey
ALTER TABLE "m_risk" ADD CONSTRAINT "m_risk_hseCategoryId_fkey" FOREIGN KEY ("hseCategoryId") REFERENCES "m_hse_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_threat_mitigations" ADD CONSTRAINT "m_threat_mitigations_threatId_fkey" FOREIGN KEY ("threatId") REFERENCES "m_risk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_risk_assessment_item" ADD CONSTRAINT "t_risk_assessment_item_mThreatId_fkey" FOREIGN KEY ("mThreatId") REFERENCES "m_risk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_work_permit_hazards" ADD CONSTRAINT "t_work_permit_hazards_hazardId_fkey" FOREIGN KEY ("hazardId") REFERENCES "m_risk"("id") ON DELETE SET NULL ON UPDATE CASCADE;
