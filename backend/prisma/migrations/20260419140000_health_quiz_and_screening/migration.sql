-- CreateEnum
CREATE TYPE "QuizKindEnum" AS ENUM ('LMS_QUIZ', 'HEALTH_DECLARATION');

-- CreateEnum
CREATE TYPE "HealthScreeningStatusEnum" AS ENUM ('DONE', 'EXPIRED');

-- AlterTable
ALTER TABLE "t_quizzes" ADD COLUMN "kind" "QuizKindEnum" NOT NULL DEFAULT 'LMS_QUIZ';

-- CreateIndex
CREATE INDEX "t_quizzes_kind_idx" ON "t_quizzes"("kind");

-- AlterTable: optional company on users
ALTER TABLE "t_users" ADD COLUMN "companyId" TEXT;

-- AlterTable: legacy health declaration URL optional
ALTER TABLE "t_work_permit_workers" ALTER COLUMN "healthDeclarationUrl" DROP NOT NULL;

-- CreateTable
CREATE TABLE "t_health_screenings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT,
    "quizId" TEXT NOT NULL,
    "quizAttemptId" TEXT NOT NULL,
    "workPermitWorkerId" TEXT,
    "status" "HealthScreeningStatusEnum",
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_health_screenings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "t_health_screenings_quizAttemptId_key" ON "t_health_screenings"("quizAttemptId");

-- CreateIndex
CREATE UNIQUE INDEX "t_health_screenings_workPermitWorkerId_key" ON "t_health_screenings"("workPermitWorkerId");

-- CreateIndex
CREATE INDEX "t_health_screenings_userId_idx" ON "t_health_screenings"("userId");

-- CreateIndex
CREATE INDEX "t_health_screenings_companyId_idx" ON "t_health_screenings"("companyId");

-- CreateIndex
CREATE INDEX "t_health_screenings_quizId_idx" ON "t_health_screenings"("quizId");

-- AddForeignKey
ALTER TABLE "t_users" ADD CONSTRAINT "t_users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "m_companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_health_screenings" ADD CONSTRAINT "t_health_screenings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "t_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_health_screenings" ADD CONSTRAINT "t_health_screenings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "m_companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_health_screenings" ADD CONSTRAINT "t_health_screenings_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "t_quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_health_screenings" ADD CONSTRAINT "t_health_screenings_quizAttemptId_fkey" FOREIGN KEY ("quizAttemptId") REFERENCES "t_quiz_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_health_screenings" ADD CONSTRAINT "t_health_screenings_workPermitWorkerId_fkey" FOREIGN KEY ("workPermitWorkerId") REFERENCES "t_work_permit_workers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
