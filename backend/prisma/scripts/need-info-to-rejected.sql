-- One-time data fix: remove legacy NEED_INFO status.
--
-- This project removed WorkPermit.status = 'NEED_INFO' in favor of a reject/edit/resubmit flow.
-- Run this manually with appropriate DB access after verifying in your environment.
--
-- Safe to re-run (idempotent): rows already migrated won't change further.

UPDATE "t_work_permits"
SET "status" = 'REJECTED'
WHERE "status" = 'NEED_INFO';

