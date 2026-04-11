-- Add inline storage provider name (backfilled from m_file_storage_providers)
ALTER TABLE "t_file_uploads" ADD COLUMN "storageProvider" TEXT;

UPDATE "t_file_uploads" u
SET "storageProvider" = p.name
FROM "m_file_storage_providers" p
WHERE u."storageProviderId" = p.id;

UPDATE "t_file_uploads"
SET "storageProvider" = 'local'
WHERE "storageProvider" IS NULL;

ALTER TABLE "t_file_uploads" ALTER COLUMN "storageProvider" SET NOT NULL;

ALTER TABLE "t_file_uploads" DROP CONSTRAINT "t_file_uploads_storageProviderId_fkey";

ALTER TABLE "t_file_uploads" DROP COLUMN "storageProviderId";

DROP TABLE "m_file_storage_providers";
