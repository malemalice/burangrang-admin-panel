-- CreateEnum
CREATE TYPE "ReminderOccurrenceState" AS ENUM (
  'SCHEDULED',
  'FIRED',
  'ACKNOWLEDGED',
  'DISMISSED',
  'MISSED',
  'FAILED'
);

-- AlterTable: add subject + recurrence-detail columns to t_reminders
ALTER TABLE "t_reminders"
  ADD COLUMN "subjectType" TEXT,
  ADD COLUMN "subjectId"   TEXT,
  ADD COLUMN "dayOfMonth"  INTEGER,
  ADD COLUMN "dayOfWeek"   INTEGER;

-- CreateIndex
CREATE INDEX "t_reminders_entity_subjectType_subjectId_idx"
  ON "t_reminders" ("entity", "subjectType", "subjectId");

-- CreateTable
CREATE TABLE "t_reminder_occurrences" (
  "id"             TEXT NOT NULL,
  "reminderId"     TEXT NOT NULL,
  "scheduledAt"    TIMESTAMP(3) NOT NULL,
  "firedAt"        TIMESTAMP(3),
  "state"          "ReminderOccurrenceState" NOT NULL DEFAULT 'SCHEDULED',
  "acknowledgedBy" TEXT,
  "acknowledgedAt" TIMESTAMP(3),
  "dismissedBy"    TEXT,
  "dismissedAt"    TIMESTAMP(3),
  "failureReason"  TEXT,
  "notificationId" TEXT,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,

  CONSTRAINT "t_reminder_occurrences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "t_reminder_occurrences_reminderId_scheduledAt_key"
  ON "t_reminder_occurrences" ("reminderId", "scheduledAt");

-- CreateIndex
CREATE INDEX "t_reminder_occurrences_scheduledAt_state_idx"
  ON "t_reminder_occurrences" ("scheduledAt", "state");

-- CreateIndex
CREATE INDEX "t_reminder_occurrences_reminderId_scheduledAt_idx"
  ON "t_reminder_occurrences" ("reminderId", "scheduledAt");

-- AddForeignKey
ALTER TABLE "t_reminder_occurrences"
  ADD CONSTRAINT "t_reminder_occurrences_reminderId_fkey"
  FOREIGN KEY ("reminderId") REFERENCES "t_reminders"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
