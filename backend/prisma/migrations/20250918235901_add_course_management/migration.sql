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
    "price" DECIMAL(10,2),
    "salePrice" DECIMAL(10,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_courses_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "_CourseToCategory" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CourseToCategory_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "t_courses_slug_key" ON "t_courses"("slug");

-- CreateIndex
CREATE INDEX "_CourseToCategory_B_index" ON "_CourseToCategory"("B");

-- AddForeignKey
ALTER TABLE "t_courses" ADD CONSTRAINT "t_courses_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "t_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_chapters" ADD CONSTRAINT "t_chapters_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "t_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CourseToCategory" ADD CONSTRAINT "_CourseToCategory_A_fkey" FOREIGN KEY ("A") REFERENCES "m_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CourseToCategory" ADD CONSTRAINT "_CourseToCategory_B_fkey" FOREIGN KEY ("B") REFERENCES "t_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
