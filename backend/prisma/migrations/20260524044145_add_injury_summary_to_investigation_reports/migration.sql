-- AlterTable
ALTER TABLE "t_investigation_reports" ADD COLUMN     "bodyPartsSummary" TEXT[],
ADD COLUMN     "injuryTypesSummary" TEXT[],
ADD COLUMN     "mechanismsSummary" TEXT[];
