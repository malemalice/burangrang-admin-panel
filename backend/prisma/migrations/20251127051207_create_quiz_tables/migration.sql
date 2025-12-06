-- CreateEnum
CREATE TYPE "QuizEntityEnum" AS ENUM ('COURSE', 'CHAPTER');

-- CreateEnum
CREATE TYPE "QuizAttemptStatusEnum" AS ENUM ('INVITING', 'INVITED', 'IN_PROGRESS', 'COMPLETED', 'ABANDONED');

-- CreateTable
CREATE TABLE "t_quizzes" (
    "id" TEXT NOT NULL,
    "entity" "QuizEntityEnum",
    "entityId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "instructions" TEXT,
    "duration" INTEGER,
    "passingScore" DECIMAL(5,2) NOT NULL DEFAULT 75,
    "maxAttempts" INTEGER,
    "shuffleQuestions" BOOLEAN NOT NULL DEFAULT false,
    "shuffleOptions" BOOLEAN NOT NULL DEFAULT false,
    "showCorrectAnswer" BOOLEAN NOT NULL DEFAULT true,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_quizzes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_quiz_questions" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "questionType" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "explanation" TEXT,
    "mediaUrl" TEXT,
    "mediaType" TEXT,
    "points" DECIMAL(5,2) NOT NULL DEFAULT 1,
    "order" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_quiz_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_quiz_question_options" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "optionText" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_quiz_question_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_quiz_assignments" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assignedBy" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3),
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_quiz_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_quiz_attempts" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "enrollmentId" TEXT,
    "userId" TEXT,
    "attemptNumber" INTEGER NOT NULL,
    "status" "QuizAttemptStatusEnum" NOT NULL DEFAULT 'IN_PROGRESS',
    "score" DECIMAL(5,2),
    "totalPoints" DECIMAL(10,2),
    "earnedPoints" DECIMAL(10,2),
    "isPassed" BOOLEAN NOT NULL DEFAULT false,
    "dueDate" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "timeSpent" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_quiz_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_quiz_answers" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "selectedOptionId" TEXT,
    "essayAnswer" TEXT,
    "isCorrect" BOOLEAN,
    "pointsEarned" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "feedback" TEXT,
    "gradedBy" TEXT,
    "gradedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_quiz_answers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "t_quizzes_entity_entityId_idx" ON "t_quizzes"("entity", "entityId");

-- CreateIndex
CREATE INDEX "t_quiz_assignments_userId_idx" ON "t_quiz_assignments"("userId");

-- CreateIndex
CREATE INDEX "t_quiz_assignments_quizId_idx" ON "t_quiz_assignments"("quizId");

-- CreateIndex
CREATE INDEX "t_quiz_assignments_status_idx" ON "t_quiz_assignments"("status");

-- CreateIndex
CREATE INDEX "t_quiz_assignments_dueDate_idx" ON "t_quiz_assignments"("dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "t_quiz_assignments_quizId_userId_key" ON "t_quiz_assignments"("quizId", "userId");

-- CreateIndex
CREATE INDEX "t_quiz_attempts_enrollmentId_quizId_idx" ON "t_quiz_attempts"("enrollmentId", "quizId");

-- CreateIndex
CREATE INDEX "t_quiz_attempts_userId_quizId_idx" ON "t_quiz_attempts"("userId", "quizId");

-- CreateIndex
CREATE INDEX "t_quiz_attempts_status_idx" ON "t_quiz_attempts"("status");

-- CreateIndex
CREATE UNIQUE INDEX "t_quiz_answers_attemptId_questionId_key" ON "t_quiz_answers"("attemptId", "questionId");

-- AddForeignKey
ALTER TABLE "t_quizzes" ADD CONSTRAINT "t_quizzes_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "t_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_quiz_questions" ADD CONSTRAINT "t_quiz_questions_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "t_quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_quiz_question_options" ADD CONSTRAINT "t_quiz_question_options_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "t_quiz_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_quiz_assignments" ADD CONSTRAINT "t_quiz_assignments_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "t_quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_quiz_assignments" ADD CONSTRAINT "t_quiz_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "t_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_quiz_assignments" ADD CONSTRAINT "t_quiz_assignments_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "t_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_quiz_attempts" ADD CONSTRAINT "t_quiz_attempts_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "t_quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_quiz_attempts" ADD CONSTRAINT "t_quiz_attempts_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "t_enrollments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_quiz_attempts" ADD CONSTRAINT "t_quiz_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "t_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_quiz_answers" ADD CONSTRAINT "t_quiz_answers_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "t_quiz_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_quiz_answers" ADD CONSTRAINT "t_quiz_answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "t_quiz_questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_quiz_answers" ADD CONSTRAINT "t_quiz_answers_selectedOptionId_fkey" FOREIGN KEY ("selectedOptionId") REFERENCES "t_quiz_question_options"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_quiz_answers" ADD CONSTRAINT "t_quiz_answers_gradedBy_fkey" FOREIGN KEY ("gradedBy") REFERENCES "t_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
