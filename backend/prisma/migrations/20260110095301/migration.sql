/*
  Warnings:

  - You are about to drop the column `userId` on the `t_reminders` table. All the data in the column will be lost.
  - Added the required column `createdBy` to the `t_reminders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `targetId` to the `t_reminders` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ReminderTargetTypeEnum" AS ENUM ('USER', 'ROLE', 'DEPARTMENT', 'OFFICE');

-- Step 1: Add new columns as nullable first
ALTER TABLE "t_reminders" 
ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "targetId" TEXT,
ADD COLUMN     "targetType" "ReminderTargetTypeEnum" DEFAULT 'USER';

-- Step 2: Migrate existing data
-- Set createdBy, targetType, and targetId based on existing userId
UPDATE "t_reminders" 
SET 
  "createdBy" = "userId",
  "targetType" = 'USER',
  "targetId" = "userId"
WHERE "userId" IS NOT NULL;

-- Step 3: Make columns NOT NULL (now that all rows have values)
ALTER TABLE "t_reminders" 
ALTER COLUMN "createdBy" SET NOT NULL,
ALTER COLUMN "targetId" SET NOT NULL,
ALTER COLUMN "targetType" SET NOT NULL;

-- Step 4: Drop old foreign key and index on userId
ALTER TABLE "public"."t_reminders" DROP CONSTRAINT IF EXISTS "t_reminders_userId_fkey";
DROP INDEX IF EXISTS "public"."t_reminders_userId_idx";

-- Step 5: Create new indexes
CREATE INDEX "t_reminders_targetType_targetId_idx" ON "t_reminders"("targetType", "targetId");
CREATE INDEX "t_reminders_createdBy_idx" ON "t_reminders"("createdBy");

-- Step 6: Add foreign key for createdBy
ALTER TABLE "t_reminders" ADD CONSTRAINT "t_reminders_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "t_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 7: Finally drop the old userId column
ALTER TABLE "t_reminders" DROP COLUMN "userId";
