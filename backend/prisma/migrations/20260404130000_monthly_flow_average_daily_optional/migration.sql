-- AlterTable: average daily flow is optional (not collected on UI)
ALTER TABLE "t_monthly_flow_reports" ALTER COLUMN "averageDailyFlow" DROP NOT NULL;
