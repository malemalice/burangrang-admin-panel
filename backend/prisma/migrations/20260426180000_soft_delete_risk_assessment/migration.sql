-- Soft delete: risk assessments, line items, polymorphic mitigation records (t_risk_mitigation)

-- t_risk_assessment
ALTER TABLE "t_risk_assessment" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deletedBy" TEXT;
DROP INDEX IF EXISTS "t_risk_assessment_code_key";
CREATE UNIQUE INDEX "t_risk_assessment_code_key" ON "t_risk_assessment"("code") WHERE "deletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS "t_risk_assessment_code_idx" ON "t_risk_assessment"("code");

-- t_risk_assessment_item
ALTER TABLE "t_risk_assessment_item" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deletedBy" TEXT;

-- t_risk_mitigation (polymorphic; code unique only for non-deleted rows)
ALTER TABLE "t_risk_mitigation" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deletedBy" TEXT;
DROP INDEX IF EXISTS "t_risk_mitigation_code_key";
CREATE UNIQUE INDEX "t_risk_mitigation_code_key" ON "t_risk_mitigation"("code") WHERE "deletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS "t_risk_mitigation_code_idx" ON "t_risk_mitigation"("code");
