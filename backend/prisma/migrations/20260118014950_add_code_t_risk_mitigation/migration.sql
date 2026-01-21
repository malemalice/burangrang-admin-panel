/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `m_risk_mitigations` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `m_risk_mitigations` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "m_risk_mitigations" ADD COLUMN     "code" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "t_inspection_items" ALTER COLUMN "status" SET DEFAULT 'OPEN';

-- CreateIndex
CREATE UNIQUE INDEX "m_risk_mitigations_code_key" ON "m_risk_mitigations"("code");
