-- No-op: renames constraints/index on `t_work_permit_classification_safety_guidance_rows` before that
-- table exists. The table is created in `20260415224900_work_permit_safety_guidance_structure` with
-- final FK and index names; no rename step is needed on fresh installs.
SELECT 1;
