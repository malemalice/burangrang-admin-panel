-- WorkPermitWorker: replace guestId with userId (workers = users with role Guest)
-- Option A: clean cut - existing worker rows are removed

-- Drop FK from t_work_permit_workers to t_guests
ALTER TABLE "t_work_permit_workers" DROP CONSTRAINT IF EXISTS "t_work_permit_workers_guestId_fkey";

-- Remove existing worker rows (guestId no longer maps to users)
DELETE FROM "t_work_permit_workers";

-- Drop guestId column and add userId
ALTER TABLE "t_work_permit_workers" DROP COLUMN "guestId";
ALTER TABLE "t_work_permit_workers" ADD COLUMN "userId" TEXT NOT NULL;

-- Add FK to t_users
ALTER TABLE "t_work_permit_workers" ADD CONSTRAINT "t_work_permit_workers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "t_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
