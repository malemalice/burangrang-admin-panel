-- CreateEnum
CREATE TYPE "RiskRatingEnum" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'EXTREME');

-- CreateTable
CREATE TABLE "m_risk_matrix" (
    "id" TEXT NOT NULL,
    "likelihoodLevel" INTEGER NOT NULL,
    "consequenceLevel" INTEGER NOT NULL,
    "risk_rating" "RiskRatingEnum" NOT NULL,

    CONSTRAINT "m_risk_matrix_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_risk_assessment" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "assessmentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "t_risk_assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_risk_assessment_item" (
    "id" TEXT NOT NULL,
    "riskAssessmentId" TEXT NOT NULL,
    "mThreatId" TEXT NOT NULL,
    "mHseCategoryId" TEXT NOT NULL,
    "likelihoodLevel" INTEGER NOT NULL,
    "consequenceLevel" INTEGER NOT NULL,
    "riskMatrixRating" "RiskRatingEnum" NOT NULL,

    CONSTRAINT "t_risk_assessment_item_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "t_risk_assessment" ADD CONSTRAINT "t_risk_assessment_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_risk_assessment_item" ADD CONSTRAINT "t_risk_assessment_item_riskAssessmentId_fkey" FOREIGN KEY ("riskAssessmentId") REFERENCES "t_risk_assessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
