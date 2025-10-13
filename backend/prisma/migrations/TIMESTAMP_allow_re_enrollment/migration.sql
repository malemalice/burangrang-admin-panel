-- DropIndex
DROP INDEX IF EXISTS "t_enrollments_userId_courseId_key";

-- CreateIndex
CREATE INDEX "t_enrollments_userId_courseId_status_idx" ON "t_enrollments"("userId", "courseId", "status");

