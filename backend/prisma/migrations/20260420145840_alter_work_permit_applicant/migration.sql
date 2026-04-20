-- DropIndex
DROP INDEX IF EXISTS "t_work_permit_workers_workerId_idx";

-- AlterTable
ALTER TABLE "t_work_permits" ADD COLUMN     "applicantUserId" TEXT;

-- AddForeignKey
ALTER TABLE "t_work_permits" ADD CONSTRAINT "t_work_permits_applicantUserId_fkey" FOREIGN KEY ("applicantUserId") REFERENCES "t_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
