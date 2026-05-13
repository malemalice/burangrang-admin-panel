/*
  Warnings:

  - You are about to drop the column `signatureUrl` on the `t_investigation_signatories` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "t_investigation_signatories_investigationReportId_signatory_key";

-- AlterTable
ALTER TABLE "t_investigation_signatories" DROP COLUMN "signatureUrl",
ALTER COLUMN "signatoryRole" DROP NOT NULL;
