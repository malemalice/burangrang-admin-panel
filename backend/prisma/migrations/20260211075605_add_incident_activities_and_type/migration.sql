-- CreateEnum
CREATE TYPE "IncidentActivitiesEnum" AS ENUM ('WORK', 'STUDY');

-- CreateEnum
CREATE TYPE "IncidentScopeEnum" AS ENUM ('GENERAL', 'SECURITY');

-- AlterTable
ALTER TABLE "t_incidents" ADD COLUMN     "activities" "IncidentActivitiesEnum" NOT NULL DEFAULT 'WORK',
ADD COLUMN     "type" "IncidentScopeEnum" NOT NULL DEFAULT 'GENERAL';

-- CreateIndex
CREATE INDEX "t_incidents_activities_idx" ON "t_incidents"("activities");

-- CreateIndex
CREATE INDEX "t_incidents_type_idx" ON "t_incidents"("type");
