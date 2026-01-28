-- AlterTable
ALTER TABLE "t_inspection_items" ADD COLUMN     "status" "GeneralStatusEnum" NOT NULL DEFAULT 'DRAFT';

-- CreateIndex
CREATE INDEX "t_inspection_items_status_idx" ON "t_inspection_items"("status");
