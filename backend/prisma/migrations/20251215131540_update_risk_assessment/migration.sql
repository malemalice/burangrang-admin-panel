/*
  Warnings:

  - Changed the type of `status` on the `t_risk_assessment` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `interpretation` to the `t_risk_assessment_item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `postConsequenceLevel` to the `t_risk_assessment_item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `postInterpretation` to the `t_risk_assessment_item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `postLikelihoodLevel` to the `t_risk_assessment_item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `postRiskMatrixRating` to the `t_risk_assessment_item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `riskDescription` to the `t_risk_assessment_item` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "t_risk_assessment" DROP COLUMN "status",
ADD COLUMN     "status" "GeneralStatusEnum" NOT NULL;

-- AlterTable
ALTER TABLE "t_risk_assessment_item" ADD COLUMN     "interpretation" "RiskRatingEnum" NOT NULL,
ADD COLUMN     "postConsequenceLevel" INTEGER NOT NULL,
ADD COLUMN     "postInterpretation" "RiskRatingEnum" NOT NULL,
ADD COLUMN     "postLikelihoodLevel" INTEGER NOT NULL,
ADD COLUMN     "postRiskMatrixRating" "RiskRatingEnum" NOT NULL,
ADD COLUMN     "riskDescription" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "t_risk_control" (
    "id" TEXT NOT NULL,
    "eliminate" TEXT,
    "transfer" TEXT,
    "reduce" TEXT,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "isAccept" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_risk_control_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "t_risk_control_entity_entityId_idx" ON "t_risk_control"("entity", "entityId");

-- CreateIndex
CREATE INDEX "t_risk_control_isActive_idx" ON "t_risk_control"("isActive");

-- AddForeignKey
ALTER TABLE "t_risk_assessment" ADD CONSTRAINT "t_risk_assessment_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "t_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
