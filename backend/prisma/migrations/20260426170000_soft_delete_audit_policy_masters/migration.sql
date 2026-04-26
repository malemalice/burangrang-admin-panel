-- Soft delete: audit policy masters (element, clause, criteria) — partial unique on code per table

ALTER TABLE "m_audit_element" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deletedBy" TEXT;
DROP INDEX IF EXISTS "m_audit_element_code_key";
CREATE UNIQUE INDEX "m_audit_element_code_key" ON "m_audit_element"("code") WHERE "deletedAt" IS NULL;

ALTER TABLE "m_audit_clause" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deletedBy" TEXT;
DROP INDEX IF EXISTS "m_audit_clause_code_key";
CREATE UNIQUE INDEX "m_audit_clause_code_key" ON "m_audit_clause"("code") WHERE "deletedAt" IS NULL;

ALTER TABLE "m_audit_criteria" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deletedBy" TEXT;
DROP INDEX IF EXISTS "m_audit_criteria_code_key";
CREATE UNIQUE INDEX "m_audit_criteria_code_key" ON "m_audit_criteria"("code") WHERE "deletedAt" IS NULL;
