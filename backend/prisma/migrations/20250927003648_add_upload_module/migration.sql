-- CreateTable
CREATE TABLE "m_file_storage_providers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_file_storage_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_file_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "allowedTypes" JSONB NOT NULL,
    "maxSize" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_file_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_file_uploads" (
    "id" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "storedName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" BIGINT NOT NULL,
    "hash" TEXT NOT NULL,
    "storageProviderId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "accessToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "metadata" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_file_uploads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_file_access_logs" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "accessedBy" TEXT,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "accessType" TEXT NOT NULL,
    "accessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "t_file_access_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "m_file_storage_providers_name_key" ON "m_file_storage_providers"("name");

-- CreateIndex
CREATE UNIQUE INDEX "m_file_categories_name_key" ON "m_file_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "t_file_uploads_accessToken_key" ON "t_file_uploads"("accessToken");

-- AddForeignKey
ALTER TABLE "t_file_uploads" ADD CONSTRAINT "t_file_uploads_storageProviderId_fkey" FOREIGN KEY ("storageProviderId") REFERENCES "m_file_storage_providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_file_uploads" ADD CONSTRAINT "t_file_uploads_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "m_file_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_file_uploads" ADD CONSTRAINT "t_file_uploads_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "t_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_file_access_logs" ADD CONSTRAINT "t_file_access_logs_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "t_file_uploads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_file_access_logs" ADD CONSTRAINT "t_file_access_logs_accessedBy_fkey" FOREIGN KEY ("accessedBy") REFERENCES "t_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
