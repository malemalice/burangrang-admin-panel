/*
  Warnings:

  - You are about to drop the `m_threat_mitigations` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."m_threat_mitigations" DROP CONSTRAINT "m_threat_mitigations_threatId_fkey";

-- DropTable
DROP TABLE "public"."m_threat_mitigations";

-- CreateTable
CREATE TABLE "m_risk_mitigations" (
    "id" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "mitigationDescription" TEXT NOT NULL,
    "eliminate" TEXT,
    "transfer" TEXT,
    "reduce" TEXT,
    "accept" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "riskId" TEXT NOT NULL,

    CONSTRAINT "m_risk_mitigations_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "m_risk_mitigations" ADD CONSTRAINT "m_risk_mitigations_riskId_fkey" FOREIGN KEY ("riskId") REFERENCES "m_risk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
