-- Add control hierarchy columns and remove legacy `reduce` columns.
-- Note: existing `reduce` data is intentionally dropped (no data copy).

-- Master data: m_risk_mitigations
ALTER TABLE "m_risk_mitigations"
  ADD COLUMN IF NOT EXISTS "eliminationControl" TEXT,
  ADD COLUMN IF NOT EXISTS "substitutionControl" TEXT,
  ADD COLUMN IF NOT EXISTS "engineeringControl" TEXT,
  ADD COLUMN IF NOT EXISTS "administrationControl" TEXT,
  ADD COLUMN IF NOT EXISTS "personalProtectiveEquipment" TEXT;

ALTER TABLE "m_risk_mitigations"
  DROP COLUMN IF EXISTS "reduce";

-- Transactional: t_risk_control
ALTER TABLE "t_risk_control"
  ADD COLUMN IF NOT EXISTS "eliminationControl" TEXT,
  ADD COLUMN IF NOT EXISTS "substitutionControl" TEXT,
  ADD COLUMN IF NOT EXISTS "engineeringControl" TEXT,
  ADD COLUMN IF NOT EXISTS "administrationControl" TEXT,
  ADD COLUMN IF NOT EXISTS "personalProtectiveEquipment" TEXT;

ALTER TABLE "t_risk_control"
  DROP COLUMN IF EXISTS "reduce";

-- Transactional: t_risk_mitigation
ALTER TABLE "t_risk_mitigation"
  ADD COLUMN IF NOT EXISTS "eliminationControl" TEXT,
  ADD COLUMN IF NOT EXISTS "substitutionControl" TEXT,
  ADD COLUMN IF NOT EXISTS "engineeringControl" TEXT,
  ADD COLUMN IF NOT EXISTS "administrationControl" TEXT,
  ADD COLUMN IF NOT EXISTS "personalProtectiveEquipment" TEXT;

ALTER TABLE "t_risk_mitigation"
  DROP COLUMN IF EXISTS "reduce";

