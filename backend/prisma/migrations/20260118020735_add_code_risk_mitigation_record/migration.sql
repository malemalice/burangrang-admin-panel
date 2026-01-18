/*
  Warnings:

  - You are about to drop the column `code` on the `m_risk_mitigations` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[code]` on the table `t_risk_mitigation` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX IF EXISTS "m_risk_mitigations_code_key";

-- AlterTable
ALTER TABLE "m_risk_mitigations" DROP COLUMN IF EXISTS "code";

-- Step 1: Add code column as nullable first
ALTER TABLE "t_risk_mitigation" ADD COLUMN "code" TEXT;

-- Step 2: Generate codes for existing rows (RSK + YYMMDDHHmmss format with timestamp from createdAt)
-- Using a function to generate unique codes based on id and createdAt
DO $$
DECLARE
    rec RECORD;
    counter INTEGER := 0;
    now_time TIMESTAMP;
    base_code TEXT;
    unique_code TEXT;
BEGIN
    now_time := NOW();
    
    FOR rec IN SELECT id, "createdAt" FROM "t_risk_mitigation" WHERE code IS NULL ORDER BY "createdAt", id LOOP
        -- Generate base code: RSK + YYMMDDHHmmss format from createdAt
        base_code := 'RSK' || TO_CHAR(COALESCE(rec."createdAt", now_time), 'YYMMDDHH24MISS');
        
        -- Ensure uniqueness by appending counter
        -- Check if code already exists, if so increment counter
        LOOP
            unique_code := base_code || LPAD(counter::TEXT, 4, '0');
            EXIT WHEN NOT EXISTS (SELECT 1 FROM "t_risk_mitigation" WHERE code = unique_code);
            counter := counter + 1;
        END LOOP;
        
        UPDATE "t_risk_mitigation"
        SET code = unique_code
        WHERE id = rec.id;
        
        counter := counter + 1;
    END LOOP;
END $$;

-- Step 3: Make code NOT NULL after populating existing rows
ALTER TABLE "t_risk_mitigation" ALTER COLUMN "code" SET NOT NULL;

-- Step 4: Create unique index
CREATE UNIQUE INDEX "t_risk_mitigation_code_key" ON "t_risk_mitigation"("code");
