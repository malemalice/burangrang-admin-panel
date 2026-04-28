-- No-op: duplicate of obsolete rename steps. The table is created in
-- `20260415224900_work_permit_safety_guidance_structure` with final FK/index names.
-- Renaming here fails on shadow DB / fresh installs (table does not exist yet).
SELECT 1;
