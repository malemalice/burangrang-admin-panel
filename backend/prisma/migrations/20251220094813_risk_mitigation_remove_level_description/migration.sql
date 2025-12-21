/*
  Warnings:

  - You are about to drop the column `level` on the `m_risk_mitigations` table. All the data in the column will be lost.
  - You are about to drop the column `mitigationDescription` on the `m_risk_mitigations` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "m_risk_mitigations" DROP COLUMN "level",
DROP COLUMN "mitigationDescription";
