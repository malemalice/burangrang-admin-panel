-- CreateEnum
CREATE TYPE "DataLevelEnum" AS ENUM ('SELF', 'DEPARTMENT', 'SUPER');

-- AlterTable
ALTER TABLE "m_roles" ADD COLUMN "dataLevel" "DataLevelEnum" NOT NULL DEFAULT 'SUPER';
