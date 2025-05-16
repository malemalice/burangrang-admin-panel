/*
  Warnings:

  - You are about to drop the column `action_plan` on the `t_risk_assessment` table. All the data in the column will be lost.
  - You are about to drop the column `assignee_id` on the `t_risk_assessment` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[code]` on the table `t_risk_assessment` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "t_risk_assessment" DROP COLUMN "action_plan",
DROP COLUMN "assignee_id",
ADD COLUMN     "actionPlan" TEXT,
ADD COLUMN     "assigneeId" TEXT,
ADD COLUMN     "description" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "t_risk_assessment_code_key" ON "t_risk_assessment"("code");

-- AddForeignKey
ALTER TABLE "t_risk_assessment" ADD CONSTRAINT "t_risk_assessment_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
