/*
  Warnings:

  - A unique constraint covering the columns `[notificationId,roleId,userId,departmentId,jobPositionId]` on the table `t_notification_recipients` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."t_notification_recipients_notificationId_roleId_userId_key";

-- AlterTable
ALTER TABLE "t_notification_recipients" ADD COLUMN     "departmentId" TEXT,
ADD COLUMN     "jobPositionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "t_notification_recipients_notificationId_roleId_userId_depa_key" ON "t_notification_recipients"("notificationId", "roleId", "userId", "departmentId", "jobPositionId");

-- AddForeignKey
ALTER TABLE "t_notification_recipients" ADD CONSTRAINT "t_notification_recipients_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "m_departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_notification_recipients" ADD CONSTRAINT "t_notification_recipients_jobPositionId_fkey" FOREIGN KEY ("jobPositionId") REFERENCES "m_job_positions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
