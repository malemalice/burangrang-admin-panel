/*
  Warnings:

  - You are about to drop the column `areaId` on the `t_inspections` table. All the data in the column will be lost.
  - Added the required column `areaId` to the `t_inspection_items` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."t_inspections" DROP CONSTRAINT "t_inspections_areaId_fkey";

-- DropIndex
DROP INDEX "public"."t_inspections_areaId_idx";

-- AlterTable
ALTER TABLE "t_inspection_items" ADD COLUMN     "areaId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "t_inspections" DROP COLUMN "areaId";

-- CreateTable
CREATE TABLE "_InspectionToArea" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "_InspectionToArea_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "_InspectionToArea_inspectionId_idx" ON "_InspectionToArea"("inspectionId");

-- CreateIndex
CREATE INDEX "_InspectionToArea_areaId_idx" ON "_InspectionToArea"("areaId");

-- CreateIndex
CREATE UNIQUE INDEX "_InspectionToArea_inspectionId_areaId_key" ON "_InspectionToArea"("inspectionId", "areaId");

-- CreateIndex
CREATE INDEX "t_inspection_items_areaId_idx" ON "t_inspection_items"("areaId");

-- AddForeignKey
ALTER TABLE "t_inspection_items" ADD CONSTRAINT "t_inspection_items_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "m_areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InspectionToArea" ADD CONSTRAINT "_InspectionToArea_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "t_inspections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InspectionToArea" ADD CONSTRAINT "_InspectionToArea_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "m_areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
