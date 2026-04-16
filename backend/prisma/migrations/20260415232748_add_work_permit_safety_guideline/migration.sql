-- No-op: the previous version renamed constraints on `t_work_permit_classification_safety_guidance_rows`
-- before that table exists. The table and FKs are created in
-- `20260415224900_work_permit_safety_guidance_structure` with the correct names.
-- Kept as an empty migration so migration history stays linear without failing on fresh DBs.
SELECT 1;
