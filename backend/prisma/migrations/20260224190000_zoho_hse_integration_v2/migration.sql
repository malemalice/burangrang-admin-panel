-- Extend existing Zoho webhook logs table (backward-compatible)
ALTER TABLE "t_zoho_webhook_logs"
ADD COLUMN IF NOT EXISTS "eventKey" TEXT,
ADD COLUMN IF NOT EXISTS "ticketId" TEXT,
ADD COLUMN IF NOT EXISTS "correlationId" TEXT,
ADD COLUMN IF NOT EXISTS "payloadSanitized" JSONB,
ADD COLUMN IF NOT EXISTS "errorSummary" TEXT;

UPDATE "t_zoho_webhook_logs"
SET "eventKey" = CONCAT('legacy-', "id")
WHERE "eventKey" IS NULL;

ALTER TABLE "t_zoho_webhook_logs"
ALTER COLUMN "eventKey" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "t_zoho_webhook_logs_eventKey_key"
ON "t_zoho_webhook_logs"("eventKey");

CREATE INDEX IF NOT EXISTS "t_zoho_webhook_logs_ticketId_idx"
ON "t_zoho_webhook_logs"("ticketId");

-- Create outbound job status enum if missing
DO $$
BEGIN
  CREATE TYPE "ZohoOutboundJobStatusEnum" AS ENUM (
    'PENDING',
    'PROCESSING',
    'SUCCESS',
    'FAILED_RETRY',
    'FAILED_DEAD_LETTER'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Mapping table Zoho ticket <-> HSE risk assessment
CREATE TABLE IF NOT EXISTS "t_zoho_ticket_risk_assessment_map" (
  "id" TEXT NOT NULL,
  "zoho_ticket_id" TEXT NOT NULL,
  "zoho_ticket_number" TEXT,
  "hse_task_id" TEXT NOT NULL,
  "last_zoho_status" TEXT,
  "last_hse_status" "GeneralStatusEnum",
  "raw_payload" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "t_zoho_ticket_risk_assessment_map_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "t_zoho_ticket_risk_assessment_map_zoho_ticket_id_key"
ON "t_zoho_ticket_risk_assessment_map"("zoho_ticket_id");

CREATE UNIQUE INDEX IF NOT EXISTS "t_zoho_ticket_risk_assessment_map_hse_task_id_key"
ON "t_zoho_ticket_risk_assessment_map"("hse_task_id");

CREATE INDEX IF NOT EXISTS "t_zoho_ticket_risk_assessment_map_hse_task_id_idx"
ON "t_zoho_ticket_risk_assessment_map"("hse_task_id");

-- Outbound synchronization jobs table
CREATE TABLE IF NOT EXISTS "t_zoho_outbound_jobs" (
  "id" TEXT NOT NULL,
  "mapping_id" TEXT NOT NULL,
  "ticket_id" TEXT NOT NULL,
  "target_status" TEXT NOT NULL,
  "request_payload" JSONB NOT NULL,
  "response_payload" JSONB,
  "status" "ZohoOutboundJobStatusEnum" NOT NULL DEFAULT 'PENDING',
  "attempt_count" INTEGER NOT NULL DEFAULT 0,
  "max_attempts" INTEGER NOT NULL DEFAULT 6,
  "next_retry_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "last_error" TEXT,
  "correlation_id" TEXT,
  "processed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "t_zoho_outbound_jobs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "t_zoho_outbound_jobs_status_next_retry_at_idx"
ON "t_zoho_outbound_jobs"("status", "next_retry_at");

CREATE INDEX IF NOT EXISTS "t_zoho_outbound_jobs_ticket_id_idx"
ON "t_zoho_outbound_jobs"("ticket_id");

-- Foreign keys
DO $$
BEGIN
  ALTER TABLE "t_zoho_ticket_risk_assessment_map"
  ADD CONSTRAINT "t_zoho_ticket_risk_assessment_map_hse_task_id_fkey"
  FOREIGN KEY ("hse_task_id") REFERENCES "t_risk_assessment"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "t_zoho_outbound_jobs"
  ADD CONSTRAINT "t_zoho_outbound_jobs_mapping_id_fkey"
  FOREIGN KEY ("mapping_id") REFERENCES "t_zoho_ticket_risk_assessment_map"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
