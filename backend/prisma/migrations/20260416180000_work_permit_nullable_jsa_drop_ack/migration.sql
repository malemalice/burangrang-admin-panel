-- Nullable JSA when not collected in the form; acknowledgment is represented by applicantSignedAt / applicantSignature.
ALTER TABLE "t_work_permits" ALTER COLUMN "jobSafetyAnalysis" DROP NOT NULL;

ALTER TABLE "t_work_permits" DROP COLUMN IF EXISTS "acknowledged_safety_guideline";
