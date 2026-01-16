-- AlterTable
ALTER TABLE "t_inspection_items" ADD COLUMN     "status" "GeneralStatusEnum" NOT NULL DEFAULT 'DRAFT';

-- CreateIndex
CREATE INDEX "t_inspection_items_status_idx" ON "t_inspection_items"("status");

-- AddForeignKey
ALTER TABLE "m_approval_item" ADD CONSTRAINT "m_approval_item_jobPositionId_fkey" FOREIGN KEY ("jobPositionId") REFERENCES "m_job_positions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_approval_item" ADD CONSTRAINT "m_approval_item_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "m_departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
