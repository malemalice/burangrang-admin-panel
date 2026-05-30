/*
  Warnings:

  - A unique constraint covering the columns `[incidentId]` on the table `t_investigation_reports` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "t_incident_assets" ADD COLUMN     "brand" TEXT;

-- CreateTable
CREATE TABLE "t_incident_third_parties" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gender" "GenderEnum",
    "company" TEXT,
    "position" VARCHAR(255),
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_incident_third_parties_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "t_incident_third_parties_incidentId_idx" ON "t_incident_third_parties"("incidentId");

-- CreateIndex
CREATE UNIQUE INDEX "t_investigation_reports_incidentId_key" ON "t_investigation_reports"("incidentId");

-- AddForeignKey
ALTER TABLE "t_incident_third_parties" ADD CONSTRAINT "t_incident_third_parties_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "t_incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
