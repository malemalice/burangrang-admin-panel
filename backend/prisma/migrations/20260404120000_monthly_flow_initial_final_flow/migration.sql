-- AlterTable
ALTER TABLE "t_monthly_flow_reports" ADD COLUMN "initialFlow" DECIMAL(10,4) NOT NULL DEFAULT 0;
ALTER TABLE "t_monthly_flow_reports" ADD COLUMN "finalFlow" DECIMAL(10,4) NOT NULL DEFAULT 0;

-- Drop defaults so application must supply values on new inserts (Prisma schema has no @default)
ALTER TABLE "t_monthly_flow_reports" ALTER COLUMN "initialFlow" DROP DEFAULT;
ALTER TABLE "t_monthly_flow_reports" ALTER COLUMN "finalFlow" DROP DEFAULT;
