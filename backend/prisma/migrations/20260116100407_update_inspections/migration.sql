-- CreateEnum
CREATE TYPE "InspectionImageTypeEnum" AS ENUM ('BEFORE', 'AFTER', 'GENERAL');

-- AlterTable
ALTER TABLE "t_inspection_images" ADD COLUMN     "type" "InspectionImageTypeEnum" NOT NULL DEFAULT 'GENERAL';

-- AlterTable
ALTER TABLE "t_inspection_items" ADD COLUMN     "dueDateAt" TIMESTAMP(3),
ADD COLUMN     "findings" TEXT;

-- AlterTable
ALTER TABLE "t_inspections" ADD COLUMN     "doneAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "t_inspection_images_inspectionItemId_type_idx" ON "t_inspection_images"("inspectionItemId", "type");
