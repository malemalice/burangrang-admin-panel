-- WorkPermitWorker: profession per worker; remove aggregate t_work_permit_professions

-- 1) Add column (nullable for backfill)
ALTER TABLE "t_work_permit_workers" ADD COLUMN "professionId" TEXT;

-- 2) Backfill from first profession line per permit (by order)
UPDATE "t_work_permit_workers" AS w
SET "professionId" = sub."professionId"
FROM (
  SELECT DISTINCT ON ("workPermitId") "workPermitId", "professionId"
  FROM "t_work_permit_professions"
  ORDER BY "workPermitId", "order" ASC
) AS sub
WHERE w."workPermitId" = sub."workPermitId";

-- 3) Any remaining rows (workers on permits with no profession lines): use lexicographically first profession id
UPDATE "t_work_permit_workers"
SET "professionId" = (SELECT "id" FROM "m_professions" ORDER BY "id" ASC LIMIT 1)
WHERE "professionId" IS NULL;

-- 4) Require profession on every worker
ALTER TABLE "t_work_permit_workers" ALTER COLUMN "professionId" SET NOT NULL;

-- 5) FK + index
ALTER TABLE "t_work_permit_workers" ADD CONSTRAINT "t_work_permit_workers_professionId_fkey" FOREIGN KEY ("professionId") REFERENCES "m_professions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "t_work_permit_workers_professionId_idx" ON "t_work_permit_workers"("professionId");

-- 6) Drop old aggregate table
DROP TABLE "t_work_permit_professions";
