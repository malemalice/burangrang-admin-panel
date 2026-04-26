/*
  Warnings:

  - Added the required column `createdBy` to the `m_heavy_equipment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "m_heavy_equipment" ADD COLUMN     "createdBy" TEXT NOT NULL,
ADD COLUMN     "isFallbackCreated" BOOLEAN NOT NULL DEFAULT false;
