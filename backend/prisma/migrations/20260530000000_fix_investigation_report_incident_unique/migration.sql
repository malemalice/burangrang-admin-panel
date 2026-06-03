-- Drop hard unique index on incidentId to allow re-creation after soft-delete
DROP INDEX IF EXISTS "t_investigation_reports_incidentId_key";

-- Add conditional unique index: enforces at most one ACTIVE report per incident
CREATE UNIQUE INDEX "t_investigation_reports_incidentId_active_unique"
  ON "t_investigation_reports" ("incidentId")
  WHERE "isActive" = true;
