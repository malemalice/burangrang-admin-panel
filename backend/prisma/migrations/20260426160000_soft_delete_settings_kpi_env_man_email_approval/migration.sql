-- Soft delete: settings, KPI targets, man hours, environmental measurements, email templates, master approvals
-- Partial uniques where business keys must allow reuse after soft delete

-- m_email_templates
ALTER TABLE "m_email_templates" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deletedBy" TEXT;
DROP INDEX IF EXISTS "m_email_templates_code_key";
CREATE UNIQUE INDEX "m_email_templates_code_key" ON "m_email_templates"("code") WHERE "deletedAt" IS NULL;

-- m_settings
ALTER TABLE "m_settings" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deletedBy" TEXT;
DROP INDEX IF EXISTS "m_settings_key_key";
CREATE UNIQUE INDEX "m_settings_key_key" ON "m_settings"("key") WHERE "deletedAt" IS NULL;

-- m_approval (master approvals)
ALTER TABLE "m_approval" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deletedBy" TEXT;

-- t_environmental_measurements
ALTER TABLE "t_environmental_measurements" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deletedBy" TEXT;

-- t_man_hours
ALTER TABLE "t_man_hours" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deletedBy" TEXT;
DROP INDEX IF EXISTS "t_man_hours_name_group_month_year_key";
CREATE UNIQUE INDEX "t_man_hours_name_group_month_year_key" ON "t_man_hours"("name", "group", "month", "year") WHERE "deletedAt" IS NULL;

-- t_hse_targets
ALTER TABLE "t_hse_targets" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deletedBy" TEXT;
DROP INDEX IF EXISTS "t_hse_targets_type_code_month_year_key";
CREATE UNIQUE INDEX "t_hse_targets_type_code_month_year_key" ON "t_hse_targets"("type", "code", "month", "year") WHERE "deletedAt" IS NULL;
