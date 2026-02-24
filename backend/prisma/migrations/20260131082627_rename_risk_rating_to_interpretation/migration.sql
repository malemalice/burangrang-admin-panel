/*
  Warnings:

  - You are about to drop the column `risk_rating` on the `m_risk_matrix` table. All the data in the column will be lost.
  - Added the required column `interpretation` to the `m_risk_matrix` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "m_risk_matrix" DROP COLUMN "risk_rating",
ADD COLUMN     "interpretation" "RiskRatingEnum" NOT NULL;
