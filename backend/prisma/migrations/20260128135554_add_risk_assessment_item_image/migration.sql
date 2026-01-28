-- CreateEnum
CREATE TYPE "RiskAssessmentItemImageTypeEnum" AS ENUM ('BEFORE', 'AFTER', 'GENERAL');

-- CreateTable
CREATE TABLE "t_risk_assessment_item_images" (
    "id" TEXT NOT NULL,
    "riskAssessmentItemId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "caption" TEXT,
    "type" "RiskAssessmentItemImageTypeEnum" NOT NULL DEFAULT 'GENERAL',
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "t_risk_assessment_item_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "t_risk_assessment_item_images_riskAssessmentItemId_idx" ON "t_risk_assessment_item_images"("riskAssessmentItemId");

-- CreateIndex
CREATE INDEX "t_risk_assessment_item_images_riskAssessmentItemId_type_idx" ON "t_risk_assessment_item_images"("riskAssessmentItemId", "type");

-- CreateIndex
CREATE INDEX "t_risk_assessment_item_images_order_idx" ON "t_risk_assessment_item_images"("order");

-- AddForeignKey
ALTER TABLE "t_risk_assessment_item_images" ADD CONSTRAINT "t_risk_assessment_item_images_riskAssessmentItemId_fkey" FOREIGN KEY ("riskAssessmentItemId") REFERENCES "t_risk_assessment_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
