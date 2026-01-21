-- AlterTable: Allow sentinel values in MasterApprovalItem
-- This migration drops foreign key constraints on jobPositionId and departmentId
-- to allow sentinel values (@ENTITY_DEPARTMENT, @ENTITY_JOB_POSITION) for dynamic approvals

-- Drop foreign key constraint on jobPositionId
ALTER TABLE "m_approval_item" DROP CONSTRAINT IF EXISTS "m_approval_item_jobPositionId_fkey";

-- Drop foreign key constraint on departmentId  
ALTER TABLE "m_approval_item" DROP CONSTRAINT IF EXISTS "m_approval_item_departmentId_fkey";

-- Note: Relations are made optional in Prisma schema (jobPosition?, department?)
-- to support sentinel values. The actual approval records in t_approvals table
-- still have foreign key constraints since those always contain valid UUIDs
-- after resolution by ApprovalResolverService.
