-- CreateEnum
CREATE TYPE "IssueStatus" AS ENUM ('OPEN', 'WAITING_APPROVAL', 'CLOSE');

-- AlterTable: Change status column type from GeneralStatusEnum to IssueStatus
-- First, update existing values to match IssueStatus values
-- DRAFT -> OPEN (since IssueStatus doesn't have DRAFT)
-- OPEN -> OPEN
-- DONE -> CLOSE
-- WAITING_APPROVAL -> WAITING_APPROVAL
-- REJECTED -> OPEN (since IssueStatus doesn't have REJECTED)
-- SCHEDULED -> OPEN (since IssueStatus doesn't have SCHEDULED)

-- Step 1: Add new column with IssueStatus type
ALTER TABLE "t_inspection_items" ADD COLUMN "status_new" "IssueStatus" DEFAULT 'OPEN';

-- Step 2: Migrate data
UPDATE "t_inspection_items" 
SET "status_new" = CASE 
  WHEN "status"::text = 'OPEN' THEN 'OPEN'::"IssueStatus"
  WHEN "status"::text = 'WAITING_APPROVAL' THEN 'WAITING_APPROVAL'::"IssueStatus"
  WHEN "status"::text = 'DONE' THEN 'CLOSE'::"IssueStatus"
  ELSE 'OPEN'::"IssueStatus"
END;

-- Step 3: Make it NOT NULL
ALTER TABLE "t_inspection_items" ALTER COLUMN "status_new" SET NOT NULL;
ALTER TABLE "t_inspection_items" ALTER COLUMN "status_new" DROP DEFAULT;

-- Step 4: Drop old column and index
DROP INDEX IF EXISTS "t_inspection_items_status_idx";
ALTER TABLE "t_inspection_items" DROP COLUMN "status";

-- Step 5: Rename new column to status
ALTER TABLE "t_inspection_items" RENAME COLUMN "status_new" TO "status";

-- CreateIndex
CREATE INDEX "t_inspection_items_status_idx" ON "t_inspection_items"("status");
