-- Soft delete: risk masters + LMS (courses, chapters)
-- Partial uniques for business keys where rows can be soft-deleted and codes/slugs reused

-- m_risk_categories
ALTER TABLE "m_risk_categories" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deletedBy" TEXT;
DROP INDEX IF EXISTS "m_risk_categories_code_key";
CREATE UNIQUE INDEX "m_risk_categories_code_key" ON "m_risk_categories"("code") WHERE "deletedAt" IS NULL;

-- m_risk
ALTER TABLE "m_risk" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deletedBy" TEXT;
DROP INDEX IF EXISTS "m_risk_code_key";
CREATE UNIQUE INDEX "m_risk_code_key" ON "m_risk"("code") WHERE "deletedAt" IS NULL;

-- m_risk_mitigations
ALTER TABLE "m_risk_mitigations" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deletedBy" TEXT;

-- m_risk_matrix
ALTER TABLE "m_risk_matrix" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deletedBy" TEXT;

-- t_courses
ALTER TABLE "t_courses" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deletedBy" TEXT;
DROP INDEX IF EXISTS "t_courses_slug_key";
CREATE UNIQUE INDEX "t_courses_slug_key" ON "t_courses"("slug") WHERE "deletedAt" IS NULL;

-- t_chapters
ALTER TABLE "t_chapters" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deletedBy" TEXT;
