/*
  Warnings:

  - You are about to drop the column `hseCategoryId` on the `m_risk` table. All the data in the column will be lost.
  - You are about to drop the column `mHseCategoryId` on the `t_risk_assessment_item` table. All the data in the column will be lost.
  - You are about to drop the `m_hse_categories` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `riskCategoryId` to the `m_risk` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mRiskCategoryId` to the `t_risk_assessment_item` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."m_risk" DROP CONSTRAINT "m_risk_hseCategoryId_fkey";

-- DropForeignKey
ALTER TABLE "public"."t_risk_assessment_item" DROP CONSTRAINT "t_risk_assessment_item_mHseCategoryId_fkey";

-- AlterTable
ALTER TABLE "m_risk" DROP COLUMN "hseCategoryId",
ADD COLUMN     "riskCategoryId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "t_risk_assessment_item" DROP COLUMN "mHseCategoryId",
ADD COLUMN     "mRiskCategoryId" TEXT NOT NULL;

-- DropTable
DROP TABLE "public"."m_hse_categories";

-- CreateTable
CREATE TABLE "m_risk_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_risk_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "m_risk_categories_code_key" ON "m_risk_categories"("code");

-- AddForeignKey
ALTER TABLE "m_risk" ADD CONSTRAINT "m_risk_riskCategoryId_fkey" FOREIGN KEY ("riskCategoryId") REFERENCES "m_risk_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_risk_assessment_item" ADD CONSTRAINT "t_risk_assessment_item_mRiskCategoryId_fkey" FOREIGN KEY ("mRiskCategoryId") REFERENCES "m_risk_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
