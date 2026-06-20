/*
  Warnings:

  - You are about to drop the column `eliminate` on the `m_risk_mitigations` table. All the data in the column will be lost.
  - You are about to drop the column `eliminate` on the `t_risk_control` table. All the data in the column will be lost.
  - You are about to drop the column `eliminate` on the `t_risk_mitigation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "m_risk_mitigations" DROP COLUMN "eliminate";

-- AlterTable
ALTER TABLE "t_risk_control" DROP COLUMN "eliminate";

-- AlterTable
ALTER TABLE "t_risk_mitigation" DROP COLUMN "eliminate";
