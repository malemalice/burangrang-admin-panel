/*
  Warnings:

  - Changed the type of `consequenceLevel` on the `m_risk_matrix` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/

-- Step 1: Convert likelihoodLevel from Int to String (1->A, 2->B, 3->C, 4->D, 5->E, etc.)
-- Create temporary column for likelihoodLevel as String
ALTER TABLE "m_risk_matrix" 
ADD COLUMN "likelihoodLevel_new" TEXT;

-- Convert likelihoodLevel from Int to String
-- Update all rows, handling nulls and edge cases
UPDATE "m_risk_matrix" 
SET "likelihoodLevel_new" = CASE 
  WHEN "likelihoodLevel" IS NULL THEN 'A'
  WHEN "likelihoodLevel" = 1 THEN 'A'
  WHEN "likelihoodLevel" = 2 THEN 'B'
  WHEN "likelihoodLevel" = 3 THEN 'C'
  WHEN "likelihoodLevel" = 4 THEN 'D'
  WHEN "likelihoodLevel" = 5 THEN 'E'
  WHEN "likelihoodLevel" = 6 THEN 'F'
  WHEN "likelihoodLevel" = 7 THEN 'G'
  WHEN "likelihoodLevel" = 8 THEN 'H'
  WHEN "likelihoodLevel" = 9 THEN 'I'
  WHEN "likelihoodLevel" = 10 THEN 'J'
  WHEN "likelihoodLevel" > 0 AND "likelihoodLevel" <= 26 THEN CHR(64 + "likelihoodLevel"::INTEGER) -- For values 11-26, convert to letter (11->K, 12->L, etc.)
  ELSE 'A' -- Default fallback
END;

-- Step 2: Convert consequenceLevel from String to Int (A->1, B->2, C->3, D->4, E->5, etc.)
-- Create temporary column for consequenceLevel as Int
ALTER TABLE "m_risk_matrix" 
ADD COLUMN "consequenceLevel_new" INTEGER;

-- Convert consequenceLevel from String to Int
-- Update all rows, handling nulls and edge cases
UPDATE "m_risk_matrix" 
SET "consequenceLevel_new" = CASE 
  WHEN "consequenceLevel" IS NULL OR "consequenceLevel" = '' THEN 1
  WHEN "consequenceLevel" = 'A' THEN 1
  WHEN "consequenceLevel" = 'B' THEN 2
  WHEN "consequenceLevel" = 'C' THEN 3
  WHEN "consequenceLevel" = 'D' THEN 4
  WHEN "consequenceLevel" = 'E' THEN 5
  WHEN "consequenceLevel" = 'F' THEN 6
  WHEN "consequenceLevel" = 'G' THEN 7
  WHEN "consequenceLevel" = 'H' THEN 8
  WHEN "consequenceLevel" = 'I' THEN 9
  WHEN "consequenceLevel" = 'J' THEN 10
  WHEN LENGTH("consequenceLevel"::TEXT) > 0 THEN ASCII(UPPER(SUBSTRING("consequenceLevel"::TEXT, 1, 1)))::INTEGER - 64 -- For single letter values > J
  ELSE 1 -- Default fallback
END;

-- Step 3: Drop old columns and rename new ones
ALTER TABLE "m_risk_matrix" 
DROP COLUMN "likelihoodLevel";

ALTER TABLE "m_risk_matrix" 
RENAME COLUMN "likelihoodLevel_new" TO "likelihoodLevel";

ALTER TABLE "m_risk_matrix" 
DROP COLUMN "consequenceLevel";

ALTER TABLE "m_risk_matrix" 
RENAME COLUMN "consequenceLevel_new" TO "consequenceLevel";

-- Step 4: Make columns NOT NULL
ALTER TABLE "m_risk_matrix" 
ALTER COLUMN "likelihoodLevel" SET NOT NULL;

ALTER TABLE "m_risk_matrix" 
ALTER COLUMN "consequenceLevel" SET NOT NULL;

-- Step 5: Update t_risk_assessment_item table
-- Convert likelihoodLevel from Int to String
ALTER TABLE "t_risk_assessment_item" 
ADD COLUMN "likelihoodLevel_new" TEXT;

UPDATE "t_risk_assessment_item" 
SET "likelihoodLevel_new" = CASE 
  WHEN "likelihoodLevel" IS NULL THEN 'A'
  WHEN "likelihoodLevel" = 1 THEN 'A'
  WHEN "likelihoodLevel" = 2 THEN 'B'
  WHEN "likelihoodLevel" = 3 THEN 'C'
  WHEN "likelihoodLevel" = 4 THEN 'D'
  WHEN "likelihoodLevel" = 5 THEN 'E'
  WHEN "likelihoodLevel" = 6 THEN 'F'
  WHEN "likelihoodLevel" = 7 THEN 'G'
  WHEN "likelihoodLevel" = 8 THEN 'H'
  WHEN "likelihoodLevel" = 9 THEN 'I'
  WHEN "likelihoodLevel" = 10 THEN 'J'
  WHEN "likelihoodLevel" > 0 AND "likelihoodLevel" <= 26 THEN CHR(64 + "likelihoodLevel"::INTEGER)
  ELSE 'A' -- Default fallback
END;

ALTER TABLE "t_risk_assessment_item" 
DROP COLUMN "likelihoodLevel";

ALTER TABLE "t_risk_assessment_item" 
RENAME COLUMN "likelihoodLevel_new" TO "likelihoodLevel";

ALTER TABLE "t_risk_assessment_item" 
ALTER COLUMN "likelihoodLevel" SET NOT NULL;

-- Convert postLikelihoodLevel from Int to String
ALTER TABLE "t_risk_assessment_item" 
ADD COLUMN "postLikelihoodLevel_new" TEXT;

UPDATE "t_risk_assessment_item" 
SET "postLikelihoodLevel_new" = CASE 
  WHEN "postLikelihoodLevel" IS NULL THEN 'A'
  WHEN "postLikelihoodLevel" = 1 THEN 'A'
  WHEN "postLikelihoodLevel" = 2 THEN 'B'
  WHEN "postLikelihoodLevel" = 3 THEN 'C'
  WHEN "postLikelihoodLevel" = 4 THEN 'D'
  WHEN "postLikelihoodLevel" = 5 THEN 'E'
  WHEN "postLikelihoodLevel" = 6 THEN 'F'
  WHEN "postLikelihoodLevel" = 7 THEN 'G'
  WHEN "postLikelihoodLevel" = 8 THEN 'H'
  WHEN "postLikelihoodLevel" = 9 THEN 'I'
  WHEN "postLikelihoodLevel" = 10 THEN 'J'
  WHEN "postLikelihoodLevel" > 0 AND "postLikelihoodLevel" <= 26 THEN CHR(64 + "postLikelihoodLevel"::INTEGER)
  ELSE 'A' -- Default fallback
END;

ALTER TABLE "t_risk_assessment_item" 
DROP COLUMN "postLikelihoodLevel";

ALTER TABLE "t_risk_assessment_item" 
RENAME COLUMN "postLikelihoodLevel_new" TO "postLikelihoodLevel";

ALTER TABLE "t_risk_assessment_item" 
ALTER COLUMN "postLikelihoodLevel" SET NOT NULL;
