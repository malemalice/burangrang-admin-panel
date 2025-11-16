/*
  Warnings:

  - You are about to drop the column `key` on the `m_email_templates` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[code]` on the table `m_email_templates` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `m_email_templates` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "m_email_templates_key_key";

-- AlterTable
ALTER TABLE "m_email_templates" DROP COLUMN "key",
ADD COLUMN     "code" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "m_email_templates_code_key" ON "m_email_templates"("code");
