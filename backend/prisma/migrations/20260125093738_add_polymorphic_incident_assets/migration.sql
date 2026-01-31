/*
  Warnings:

  - Added the required column `updatedAt` to the `t_incident_assets` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EquipmentEntityEnum" AS ENUM ('ASSET', 'HEAVY_EQUIPMENT', 'SAFETY_EQUIPMENT');

-- AlterTable
ALTER TABLE "t_incident_assets" ADD COLUMN     "entity" "EquipmentEntityEnum",
ADD COLUMN     "entityId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "m_assets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "brand" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_assets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "m_assets_code_key" ON "m_assets"("code");

-- CreateIndex
CREATE INDEX "t_incident_assets_entity_entityId_idx" ON "t_incident_assets"("entity", "entityId");
