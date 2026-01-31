/*
  Warnings:

  - Added the required column `dateSampleTaken` to the `m_water_quality_parameters` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "m_water_quality_parameters" ADD COLUMN     "dateSampleTaken" TIMESTAMP(3) NOT NULL;
