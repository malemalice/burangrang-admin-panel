-- Drop existing foreign keys
ALTER TABLE "m_approval_item" DROP CONSTRAINT IF EXISTS "m_approval_item_role_id_fkey";
ALTER TABLE "t_approvals" DROP CONSTRAINT IF EXISTS "t_approvals_role_id_fkey";

-- Rename columns
ALTER TABLE "m_approval_item" RENAME COLUMN "role_id" TO "job_position_id";
ALTER TABLE "t_approvals" RENAME COLUMN "role_id" TO "job_position_id";

-- Add new foreign keys
ALTER TABLE "m_approval_item" ADD CONSTRAINT "m_approval_item_job_position_id_fkey" FOREIGN KEY ("job_position_id") REFERENCES "job_positions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "t_approvals" ADD CONSTRAINT "t_approvals_job_position_id_fkey" FOREIGN KEY ("job_position_id") REFERENCES "job_positions"("id") ON DELETE RESTRICT ON UPDATE CASCADE; 