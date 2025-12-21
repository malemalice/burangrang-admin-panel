-- CreateEnum
CREATE TYPE "ReminderStatusEnum" AS ENUM ('PENDING', 'SENT', 'EXPIRED', 'CANCELLED', 'FAILED');

-- CreateEnum
CREATE TYPE "ReminderRepeatTypeEnum" AS ENUM ('NONE', 'WEEKLY', 'MONTHLY');

-- CreateTable
CREATE TABLE "t_reminders" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entity" TEXT,
    "entityId" TEXT,
    "message" TEXT NOT NULL,
    "remindAt" TIMESTAMP(3) NOT NULL,
    "repeatType" "ReminderRepeatTypeEnum",
    "repeatUntil" TIMESTAMP(3),
    "status" "ReminderStatusEnum" NOT NULL DEFAULT 'PENDING',
    "lastSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_reminder_logs" (
    "id" TEXT NOT NULL,
    "reminderId" TEXT NOT NULL,
    "executionStatus" TEXT NOT NULL,
    "executionDuration" INTEGER,
    "failureReason" TEXT,
    "notificationId" TEXT,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "emailError" TEXT,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "t_reminder_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "t_reminders_status_remindAt_idx" ON "t_reminders"("status", "remindAt");

-- CreateIndex
CREATE INDEX "t_reminders_userId_idx" ON "t_reminders"("userId");

-- CreateIndex
CREATE INDEX "t_reminders_entity_entityId_idx" ON "t_reminders"("entity", "entityId");

-- CreateIndex
CREATE INDEX "t_reminder_logs_reminderId_idx" ON "t_reminder_logs"("reminderId");

-- CreateIndex
CREATE INDEX "t_reminder_logs_executedAt_idx" ON "t_reminder_logs"("executedAt");

-- CreateIndex
CREATE INDEX "t_reminder_logs_executionStatus_idx" ON "t_reminder_logs"("executionStatus");

-- AddForeignKey
ALTER TABLE "t_reminders" ADD CONSTRAINT "t_reminders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "t_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_reminder_logs" ADD CONSTRAINT "t_reminder_logs_reminderId_fkey" FOREIGN KEY ("reminderId") REFERENCES "t_reminders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_reminder_logs" ADD CONSTRAINT "t_reminder_logs_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "t_notifications"("id") ON DELETE SET NULL ON UPDATE CASCADE;
