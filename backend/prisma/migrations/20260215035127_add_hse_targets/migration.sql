-- CreateEnum
CREATE TYPE "HseTargetTypeEnum" AS ENUM ('INCIDENT', 'RISK', 'INSPECTION', 'AUDIT');

-- CreateTable
CREATE TABLE "t_hse_targets" (
    "id" TEXT NOT NULL,
    "type" "HseTargetTypeEnum" NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT,
    "month" "MonthEnum",
    "year" INTEGER NOT NULL,
    "target" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "t_hse_targets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "t_hse_targets_type_year_idx" ON "t_hse_targets"("type", "year");

-- CreateIndex
CREATE UNIQUE INDEX "t_hse_targets_type_code_month_year_key" ON "t_hse_targets"("type", "code", "month", "year");

-- AddForeignKey
ALTER TABLE "t_hse_targets" ADD CONSTRAINT "t_hse_targets_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "t_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
