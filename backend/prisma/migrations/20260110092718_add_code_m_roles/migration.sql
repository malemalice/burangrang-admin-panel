/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `m_roles` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `m_roles` table without a default value. This is not possible if the table is not empty.

*/
-- Step 1: Add column as nullable first
ALTER TABLE "m_roles" ADD COLUMN "code" TEXT;

-- Step 2: Update existing records
-- Set code based on name (uppercase, replace spaces with underscores)
UPDATE "m_roles" 
SET "code" = UPPER(REPLACE("name", ' ', '_'))
WHERE "code" IS NULL;

-- Step 3: Make column NOT NULL
ALTER TABLE "m_roles" ALTER COLUMN "code" SET NOT NULL;

-- Step 4: Create unique index
CREATE UNIQUE INDEX "m_roles_code_key" ON "m_roles"("code");
