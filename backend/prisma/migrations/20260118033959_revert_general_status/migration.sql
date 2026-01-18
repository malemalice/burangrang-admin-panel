/*
  Warnings:

  - The `status` column on the `t_inspection_items` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterEnum
ALTER TYPE "GeneralStatusEnum" ADD VALUE 'CLOSE';

-- AlterTable
ALTER TABLE "t_inspection_items" DROP COLUMN "status",
ADD COLUMN     "status" "GeneralStatusEnum" NOT NULL DEFAULT 'OPEN';

-- DropEnum
DROP TYPE "public"."IssueStatus";

-- CreateIndex
CREATE INDEX "t_inspection_items_status_idx" ON "t_inspection_items"("status");
