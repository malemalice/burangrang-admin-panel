-- Step 1: Add new columns with default values
ALTER TABLE "m_risk_matrix" 
ADD COLUMN "likelihoodName" TEXT NOT NULL DEFAULT '',
ADD COLUMN "likelihoodDesc" TEXT NOT NULL DEFAULT '',
ADD COLUMN "consequenceName" TEXT NOT NULL DEFAULT '',
ADD COLUMN "consequenceDesc" TEXT NOT NULL DEFAULT '',
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Step 2: Create a temporary column for consequenceLevel as String
ALTER TABLE "m_risk_matrix" 
ADD COLUMN "consequenceLevel_new" TEXT;

-- Step 3: Convert consequenceLevel from Int to String (1->A, 2->B, 3->C, 4->D, 5->E)
UPDATE "m_risk_matrix" 
SET "consequenceLevel_new" = CASE 
  WHEN "consequenceLevel" = 1 THEN 'A'
  WHEN "consequenceLevel" = 2 THEN 'B'
  WHEN "consequenceLevel" = 3 THEN 'C'
  WHEN "consequenceLevel" = 4 THEN 'D'
  WHEN "consequenceLevel" = 5 THEN 'E'
  ELSE 'A'
END;

-- Step 4: Populate likelihood fields based on likelihoodLevel
UPDATE "m_risk_matrix"
SET 
  "likelihoodName" = CASE 
    WHEN "likelihoodLevel" = 1 THEN 'Unlikely'
    WHEN "likelihoodLevel" = 2 THEN 'Less likely to occur'
    WHEN "likelihoodLevel" = 3 THEN 'Probably'
    WHEN "likelihoodLevel" = 4 THEN 'Likely to occur'
    WHEN "likelihoodLevel" = 5 THEN 'Most likely'
    ELSE 'Unknown'
  END,
  "likelihoodDesc" = CASE 
    WHEN "likelihoodLevel" = 1 THEN 'occur one time in three year of the work cycle'
    WHEN "likelihoodLevel" = 2 THEN 'occur one time in a year of the work cycle'
    WHEN "likelihoodLevel" = 3 THEN 'occur more than one time in a year of the work cycle'
    WHEN "likelihoodLevel" = 4 THEN 'occur more than one time in a month of the work cycle'
    WHEN "likelihoodLevel" = 5 THEN 'occur more than one time in a week of the work cycle'
    ELSE ''
  END;

-- Step 5: Populate consequence fields based on consequenceLevel (using the new string value)
UPDATE "m_risk_matrix"
SET 
  "consequenceName" = CASE 
    WHEN "consequenceLevel_new" = 'A' THEN 'Insignificant'
    WHEN "consequenceLevel_new" = 'B' THEN 'Minor'
    WHEN "consequenceLevel_new" = 'C' THEN 'Moderate'
    WHEN "consequenceLevel_new" = 'D' THEN 'Major'
    WHEN "consequenceLevel_new" = 'E' THEN 'Extreme'
    ELSE 'Unknown'
  END,
  "consequenceDesc" = CASE 
    WHEN "consequenceLevel_new" = 'A' THEN 'Incident without injury and can continue to work again'
    WHEN "consequenceLevel_new" = 'B' THEN 'Incident without loss of time injury but require medical treatment at medical'
    WHEN "consequenceLevel_new" = 'C' THEN 'Incident with loss time injury but not stopping the work process/activities'
    WHEN "consequenceLevel_new" = 'D' THEN 'Incidents with loss time injury and stopping the work process/activities. Causes large and extensive environmental damage'
    WHEN "consequenceLevel_new" = 'E' THEN 'Incidents that could result in death or permanent disability'
    ELSE ''
  END;

-- Step 6: Drop old consequenceLevel column and rename new one
ALTER TABLE "m_risk_matrix" 
DROP COLUMN "consequenceLevel";

ALTER TABLE "m_risk_matrix" 
RENAME COLUMN "consequenceLevel_new" TO "consequenceLevel";

-- Step 7: Make consequenceLevel NOT NULL
ALTER TABLE "m_risk_matrix" 
ALTER COLUMN "consequenceLevel" SET NOT NULL;
