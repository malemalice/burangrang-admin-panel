-- AlterTable
ALTER TABLE "t_audits" ADD COLUMN     "periodId" TEXT;

-- CreateTable
CREATE TABLE "t_audit_periods" (
    "id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,

    CONSTRAINT "t_audit_periods_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "t_audit_periods_year_month_idx" ON "t_audit_periods"("year", "month");

-- CreateIndex
CREATE INDEX "t_audits_periodId_idx" ON "t_audits"("periodId");

-- AddForeignKey
ALTER TABLE "t_audit_periods" ADD CONSTRAINT "t_audit_periods_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "t_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_audits" ADD CONSTRAINT "t_audits_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "t_audit_periods"("id") ON DELETE SET NULL ON UPDATE CASCADE;
