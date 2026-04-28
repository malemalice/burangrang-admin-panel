-- WorkPermitWorker: profession and idNumber live on User only; drop duplicate columns.

-- Drop FK and index on professionId first
ALTER TABLE "t_work_permit_workers" DROP CONSTRAINT IF EXISTS "t_work_permit_workers_professionId_fkey";

DROP INDEX IF EXISTS "t_work_permit_workers_professionId_idx";

ALTER TABLE "t_work_permit_workers" DROP COLUMN IF EXISTS "professionId";
ALTER TABLE "t_work_permit_workers" DROP COLUMN IF EXISTS "idNumber";
