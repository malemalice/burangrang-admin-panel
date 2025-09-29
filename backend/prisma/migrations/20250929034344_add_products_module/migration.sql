/*
  Warnings:

  - A unique constraint covering the columns `[productId]` on the table `t_courses` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "t_courses" ADD COLUMN     "productId" TEXT;

-- CreateTable
CREATE TABLE "t_products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "shortDescription" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "salePrice" DECIMAL(10,2),
    "sku" TEXT NOT NULL,
    "productType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "stockQuantity" INTEGER NOT NULL DEFAULT 0,
    "downloadLimit" INTEGER,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "rating" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "thumbnailUrl" TEXT,
    "createdBy" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ProductToCategory" (
    "productId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "_ProductToCategory_pkey" PRIMARY KEY ("productId","categoryId")
);

-- CreateTable
CREATE TABLE "t_product_files" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" BIGINT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_product_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_product_downloads" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "fileId" TEXT,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "downloadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "t_product_downloads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "t_products_slug_key" ON "t_products"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "t_products_sku_key" ON "t_products"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "t_courses_productId_key" ON "t_courses"("productId");

-- AddForeignKey
ALTER TABLE "t_courses" ADD CONSTRAINT "t_courses_productId_fkey" FOREIGN KEY ("productId") REFERENCES "t_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_products" ADD CONSTRAINT "t_products_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "t_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductToCategory" ADD CONSTRAINT "_ProductToCategory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "t_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductToCategory" ADD CONSTRAINT "_ProductToCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "m_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_product_files" ADD CONSTRAINT "t_product_files_productId_fkey" FOREIGN KEY ("productId") REFERENCES "t_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_product_downloads" ADD CONSTRAINT "t_product_downloads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "t_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_product_downloads" ADD CONSTRAINT "t_product_downloads_productId_fkey" FOREIGN KEY ("productId") REFERENCES "t_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_product_downloads" ADD CONSTRAINT "t_product_downloads_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "t_product_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;
