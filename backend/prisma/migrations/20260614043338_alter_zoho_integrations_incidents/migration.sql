/*
  Warnings:

  - You are about to drop the `t_zoho_ticket_risk_assessment_map` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "t_zoho_outbound_jobs" DROP CONSTRAINT "t_zoho_outbound_jobs_mapping_id_fkey";

-- DropForeignKey
ALTER TABLE "t_zoho_ticket_risk_assessment_map" DROP CONSTRAINT "t_zoho_ticket_risk_assessment_map_hse_task_id_fkey";

-- DropIndex
DROP INDEX "t_investigation_reports_incidentId_key";

-- DropTable
DROP TABLE "t_zoho_ticket_risk_assessment_map";

-- CreateTable
CREATE TABLE "t_zoho_ticket_incident_map" (
    "id" TEXT NOT NULL,
    "zoho_ticket_id" TEXT NOT NULL,
    "zoho_ticket_number" TEXT,
    "hse_task_id" TEXT NOT NULL,
    "last_zoho_status" TEXT,
    "last_hse_status" "GeneralStatusEnum",
    "raw_payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_zoho_ticket_incident_map_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "t_zoho_ticket_incident_map_zoho_ticket_id_key" ON "t_zoho_ticket_incident_map"("zoho_ticket_id");

-- CreateIndex
CREATE UNIQUE INDEX "t_zoho_ticket_incident_map_hse_task_id_key" ON "t_zoho_ticket_incident_map"("hse_task_id");

-- CreateIndex
CREATE INDEX "t_zoho_ticket_incident_map_hse_task_id_idx" ON "t_zoho_ticket_incident_map"("hse_task_id");

-- AddForeignKey
ALTER TABLE "t_zoho_ticket_incident_map" ADD CONSTRAINT "t_zoho_ticket_incident_map_hse_task_id_fkey" FOREIGN KEY ("hse_task_id") REFERENCES "t_incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_zoho_outbound_jobs" ADD CONSTRAINT "t_zoho_outbound_jobs_mapping_id_fkey" FOREIGN KEY ("mapping_id") REFERENCES "t_zoho_ticket_incident_map"("id") ON DELETE CASCADE ON UPDATE CASCADE;
