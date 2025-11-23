-- CreateEnum
CREATE TYPE "EnrollmentStatusEnum" AS ENUM ('INVITED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'EXPIRED');

-- CreateTable
CREATE TABLE "m_course_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_course_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_chapters" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "contentType" TEXT NOT NULL,
    "contentUrl" TEXT,
    "youtubeVideoId" TEXT,
    "content" TEXT,
    "isFree" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_chapters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_courses" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "shortDescription" TEXT,
    "thumbnailUrl" TEXT,
    "totalChapters" INTEGER NOT NULL DEFAULT 0,
    "totalDuration" INTEGER NOT NULL DEFAULT 0,
    "difficulty" TEXT NOT NULL DEFAULT 'beginner',
    "language" TEXT NOT NULL DEFAULT 'en',
    "rating" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "studentCount" INTEGER NOT NULL DEFAULT 0,
    "instructorId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_enrollments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "status" "EnrollmentStatusEnum" NOT NULL DEFAULT 'INVITED',
    "enrolledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "progress" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "score" DECIMAL(5,2),
    "summaries" JSONB,
    "lastAccessedAt" TIMESTAMP(3),
    "assignedBy" TEXT,
    "assignedAt" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_progress" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "timeSpent" INTEGER NOT NULL DEFAULT 0,
    "progress" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "lastAccessedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CourseToCategory" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CourseToCategory_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "m_course_categories_name_key" ON "m_course_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "m_course_categories_slug_key" ON "m_course_categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "t_courses_slug_key" ON "t_courses"("slug");

-- CreateIndex
CREATE INDEX "t_enrollments_userId_courseId_status_idx" ON "t_enrollments"("userId", "courseId", "status");

-- CreateIndex
CREATE INDEX "t_enrollments_assignedBy_idx" ON "t_enrollments"("assignedBy");

-- CreateIndex
CREATE INDEX "t_enrollments_dueDate_idx" ON "t_enrollments"("dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "t_progress_enrollmentId_chapterId_key" ON "t_progress"("enrollmentId", "chapterId");

-- CreateIndex
CREATE INDEX "_CourseToCategory_B_index" ON "_CourseToCategory"("B");

-- AddForeignKey
ALTER TABLE "t_chapters" ADD CONSTRAINT "t_chapters_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "t_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_courses" ADD CONSTRAINT "t_courses_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "t_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_enrollments" ADD CONSTRAINT "t_enrollments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "t_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_enrollments" ADD CONSTRAINT "t_enrollments_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "t_courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_enrollments" ADD CONSTRAINT "t_enrollments_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "t_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_progress" ADD CONSTRAINT "t_progress_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "t_enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_progress" ADD CONSTRAINT "t_progress_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "t_chapters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CourseToCategory" ADD CONSTRAINT "_CourseToCategory_A_fkey" FOREIGN KEY ("A") REFERENCES "t_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CourseToCategory" ADD CONSTRAINT "_CourseToCategory_B_fkey" FOREIGN KEY ("B") REFERENCES "m_course_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
