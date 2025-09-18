-- CreateTable
CREATE TABLE "m_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "parentId" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "m_categories_slug_key" ON "m_categories"("slug");

-- AddForeignKey
ALTER TABLE "m_categories" ADD CONSTRAINT "m_categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "m_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
