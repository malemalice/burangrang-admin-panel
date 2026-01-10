/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `m_roles` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `m_roles` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "m_roles" ADD COLUMN     "code" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "m_roles_code_key" ON "m_roles"("code");
