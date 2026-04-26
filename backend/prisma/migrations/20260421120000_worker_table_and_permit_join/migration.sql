-- Normalize worker: profile data on t_worker; t_work_permit_workers is join only.
-- Health screenings link to t_worker instead of t_work_permit_workers.

-- 1) Worker table
CREATE TABLE "t_worker" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "certificateUrl" TEXT,
    "healthDeclarationUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_worker_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "t_worker_userId_key" ON "t_worker"("userId");

ALTER TABLE "t_worker" ADD CONSTRAINT "t_worker_userId_fkey" FOREIGN KEY ("userId") REFERENCES "t_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 2) Backfill one Worker per distinct user on work permit workers (latest non-null URLs win)
INSERT INTO "t_worker" ("id", "userId", "certificateUrl", "healthDeclarationUrl", "createdAt", "updatedAt")
SELECT
  gen_random_uuid(),
  u."userId",
  cert."certificateUrl",
  decl."healthDeclarationUrl",
  NOW(),
  NOW()
FROM (SELECT DISTINCT "userId" FROM "t_work_permit_workers") AS u
LEFT JOIN LATERAL (
  SELECT "certificateUrl" FROM "t_work_permit_workers" w
  WHERE w."userId" = u."userId" AND w."certificateUrl" IS NOT NULL
  ORDER BY w."createdAt" DESC LIMIT 1
) cert ON true
LEFT JOIN LATERAL (
  SELECT "healthDeclarationUrl" FROM "t_work_permit_workers" w
  WHERE w."userId" = u."userId" AND w."healthDeclarationUrl" IS NOT NULL
  ORDER BY w."createdAt" DESC LIMIT 1
) decl ON true;

-- 3) Add workerId to join table and populate
ALTER TABLE "t_work_permit_workers" ADD COLUMN "workerId" TEXT;

UPDATE "t_work_permit_workers" wpw
SET "workerId" = w."id"
FROM "t_worker" w
WHERE w."userId" = wpw."userId";

ALTER TABLE "t_work_permit_workers" ALTER COLUMN "workerId" SET NOT NULL;

-- 4) Health screenings: workerId from old work permit worker link
ALTER TABLE "t_health_screenings" ADD COLUMN "workerId" TEXT;

UPDATE "t_health_screenings" hs
SET "workerId" = wpw."workerId"
FROM "t_work_permit_workers" wpw
WHERE hs."workPermitWorkerId" IS NOT NULL
  AND wpw."id" = hs."workPermitWorkerId";

-- Drop FK and unique on workPermitWorkerId
ALTER TABLE "t_health_screenings" DROP CONSTRAINT IF EXISTS "t_health_screenings_workPermitWorkerId_fkey";

DROP INDEX IF EXISTS "t_health_screenings_workPermitWorkerId_key";

ALTER TABLE "t_health_screenings" DROP COLUMN "workPermitWorkerId";

ALTER TABLE "t_health_screenings" ADD CONSTRAINT "t_health_screenings_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "t_worker"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "t_health_screenings_workerId_idx" ON "t_health_screenings"("workerId");

-- 5) Join table: drop user + URL columns, add worker FK
ALTER TABLE "t_work_permit_workers" DROP CONSTRAINT IF EXISTS "t_work_permit_workers_userId_fkey";

ALTER TABLE "t_work_permit_workers" DROP COLUMN "userId";
ALTER TABLE "t_work_permit_workers" DROP COLUMN "certificateUrl";
ALTER TABLE "t_work_permit_workers" DROP COLUMN "healthDeclarationUrl";

ALTER TABLE "t_work_permit_workers" ADD CONSTRAINT "t_work_permit_workers_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "t_worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "t_work_permit_workers_workerId_idx" ON "t_work_permit_workers"("workerId");
