/*
  Warnings:

  - You are about to drop the column `hasInjuredPerson` on the `t_incident_injured_persons` table. All the data in the column will be lost.
  - You are about to drop the column `hasWitness` on the `t_incident_witnesses` table. All the data in the column will be lost.
  - You are about to drop the column `incidentLocation` on the `t_incidents` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[roomId]` on the table `t_incidents` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "t_incident_injured_persons" DROP COLUMN "hasInjuredPerson";

-- AlterTable
ALTER TABLE "t_incident_witnesses" DROP COLUMN "hasWitness";

-- AlterTable
ALTER TABLE "t_incidents" DROP COLUMN "incidentLocation",
ADD COLUMN     "roomId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "t_incidents_roomId_key" ON "t_incidents"("roomId");

-- CreateIndex
CREATE INDEX "t_incidents_roomId_idx" ON "t_incidents"("roomId");

-- AddForeignKey
ALTER TABLE "t_incidents" ADD CONSTRAINT "t_incidents_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "m_rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;
