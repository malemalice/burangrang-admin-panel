/*
  Warnings:

  - You are about to drop the column `description` on the `t_inspections` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "t_inspection_items" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "t_inspections" DROP COLUMN "description";
