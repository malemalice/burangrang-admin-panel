/*
  Warnings:

  - You are about to drop the column `order` on the `t_inspection_items` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."t_courses" DROP CONSTRAINT "t_courses_instructorId_fkey";

-- AlterTable
ALTER TABLE "t_courses" ALTER COLUMN "instructorId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "t_inspection_items" DROP COLUMN "order",
ALTER COLUMN "status" SET DEFAULT 'OPEN';

-- AddForeignKey
ALTER TABLE "t_courses" ADD CONSTRAINT "t_courses_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "t_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
