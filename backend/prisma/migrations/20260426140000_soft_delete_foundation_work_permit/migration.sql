-- Soft delete: deletedAt, deletedBy on foundation + work permit tables
-- Replace global unique indexes on business keys with partial uniques (active rows only)

-- t_users
ALTER TABLE "t_users" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deletedBy" TEXT;
DROP INDEX IF EXISTS "t_users_email_key";
CREATE UNIQUE INDEX "t_users_email_key" ON "t_users"("email") WHERE "deletedAt" IS NULL;

-- m_roles
ALTER TABLE "m_roles" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deletedBy" TEXT;
DROP INDEX IF EXISTS "m_roles_name_key";
DROP INDEX IF EXISTS "m_roles_code_key";
CREATE UNIQUE INDEX "m_roles_name_key" ON "m_roles"("name") WHERE "deletedAt" IS NULL;
CREATE UNIQUE INDEX "m_roles_code_key" ON "m_roles"("code") WHERE "deletedAt" IS NULL;

-- m_permissions
ALTER TABLE "m_permissions" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deletedBy" TEXT;
DROP INDEX IF EXISTS "m_permissions_name_key";
CREATE UNIQUE INDEX "m_permissions_name_key" ON "m_permissions"("name") WHERE "deletedAt" IS NULL;

-- m_menus
ALTER TABLE "m_menus" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deletedBy" TEXT;

-- m_offices
ALTER TABLE "m_offices" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deletedBy" TEXT;
DROP INDEX IF EXISTS "m_offices_code_key";
CREATE UNIQUE INDEX "m_offices_code_key" ON "m_offices"("code") WHERE "deletedAt" IS NULL;

-- m_departments
ALTER TABLE "m_departments" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deletedBy" TEXT;
DROP INDEX IF EXISTS "m_departments_code_key";
CREATE UNIQUE INDEX "m_departments_code_key" ON "m_departments"("code") WHERE "deletedAt" IS NULL;

-- m_job_positions
ALTER TABLE "m_job_positions" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deletedBy" TEXT;
DROP INDEX IF EXISTS "m_job_positions_code_key";
CREATE UNIQUE INDEX "m_job_positions_code_key" ON "m_job_positions"("code") WHERE "deletedAt" IS NULL;

-- m_companies
ALTER TABLE "m_companies" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deletedBy" TEXT;
DROP INDEX IF EXISTS "m_companies_code_key";
CREATE UNIQUE INDEX "m_companies_code_key" ON "m_companies"("code") WHERE "deletedAt" IS NULL;

-- m_professions
ALTER TABLE "m_professions" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deletedBy" TEXT;
DROP INDEX IF EXISTS "m_professions_code_key";
CREATE UNIQUE INDEX "m_professions_code_key" ON "m_professions"("code") WHERE "deletedAt" IS NULL;

-- m_areas
ALTER TABLE "m_areas" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deletedBy" TEXT;
DROP INDEX IF EXISTS "m_areas_code_key";
CREATE UNIQUE INDEX "m_areas_code_key" ON "m_areas"("code") WHERE "deletedAt" IS NULL;

-- m_work_classification
ALTER TABLE "m_work_classification" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deletedBy" TEXT;
DROP INDEX IF EXISTS "m_work_classification_code_key";
CREATE UNIQUE INDEX "m_work_classification_code_key" ON "m_work_classification"("code") WHERE "deletedAt" IS NULL;

-- m_heavy_equipment
ALTER TABLE "m_heavy_equipment" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deletedBy" TEXT;
DROP INDEX IF EXISTS "m_heavy_equipment_code_key";
CREATE UNIQUE INDEX "m_heavy_equipment_code_key" ON "m_heavy_equipment"("code") WHERE "deletedAt" IS NULL;

-- m_tools, m_materials, m_machines
ALTER TABLE "m_tools" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deletedBy" TEXT;
DROP INDEX IF EXISTS "m_tools_code_key";
CREATE UNIQUE INDEX "m_tools_code_key" ON "m_tools"("code") WHERE "deletedAt" IS NULL;

ALTER TABLE "m_materials" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deletedBy" TEXT;
DROP INDEX IF EXISTS "m_materials_code_key";
CREATE UNIQUE INDEX "m_materials_code_key" ON "m_materials"("code") WHERE "deletedAt" IS NULL;

ALTER TABLE "m_machines" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deletedBy" TEXT;
DROP INDEX IF EXISTS "m_machines_code_key";
CREATE UNIQUE INDEX "m_machines_code_key" ON "m_machines"("code") WHERE "deletedAt" IS NULL;

-- m_rooms (one room per area for active rows)
ALTER TABLE "m_rooms" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deletedBy" TEXT;
DROP INDEX IF EXISTS "m_rooms_code_key";
DROP INDEX IF EXISTS "m_rooms_areaId_key";
CREATE UNIQUE INDEX "m_rooms_code_key" ON "m_rooms"("code") WHERE "deletedAt" IS NULL;
CREATE UNIQUE INDEX "m_rooms_areaId_key" ON "m_rooms"("areaId") WHERE "deletedAt" IS NULL;

-- t_guests
ALTER TABLE "t_guests" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deletedBy" TEXT;

-- t_work_permits
ALTER TABLE "t_work_permits" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deletedBy" TEXT;
DROP INDEX IF EXISTS "t_work_permits_code_key";
CREATE UNIQUE INDEX "t_work_permits_code_key" ON "t_work_permits"("code") WHERE "deletedAt" IS NULL;
