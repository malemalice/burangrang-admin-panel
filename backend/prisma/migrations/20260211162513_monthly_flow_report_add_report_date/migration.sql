-- AlterTable
ALTER TABLE "t_monthly_flow_reports" ADD COLUMN     "reportDate" TIMESTAMP(3),
ALTER COLUMN "reportMonth" DROP NOT NULL,
ALTER COLUMN "reportYear" DROP NOT NULL;
