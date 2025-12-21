-- AlterTable: Rename mThreatId column to mriskid
ALTER TABLE "t_risk_assessment_item" RENAME COLUMN "mThreatId" TO "mriskid";

-- AlterTable: Change riskMatrixRating from enum to text
ALTER TABLE "t_risk_assessment_item" ALTER COLUMN "riskMatrixRating" TYPE TEXT USING "riskMatrixRating"::TEXT;

-- AlterTable: Change postRiskMatrixRating from enum to text
ALTER TABLE "t_risk_assessment_item" ALTER COLUMN "postRiskMatrixRating" TYPE TEXT USING "postRiskMatrixRating"::TEXT;

-- DropForeignKey (if constraint name exists)
ALTER TABLE "t_risk_assessment_item" DROP CONSTRAINT IF EXISTS "t_risk_assessment_item_mThreatId_fkey";

-- AddForeignKey with new column name
ALTER TABLE "t_risk_assessment_item" ADD CONSTRAINT "t_risk_assessment_item_mriskid_fkey" FOREIGN KEY ("mriskid") REFERENCES "m_risk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
