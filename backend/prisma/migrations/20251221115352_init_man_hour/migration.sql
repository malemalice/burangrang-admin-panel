-- CreateEnum
CREATE TYPE "ManHourGroupEnum" AS ENUM ('STUDENT', 'NON_STUDENT');

-- CreateTable
CREATE TABLE "t_man_hours" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "group" "ManHourGroupEnum" NOT NULL,
    "qty" INTEGER NOT NULL,
    "manHourPerDay" DECIMAL(4,2) NOT NULL,
    "month" "MonthEnum" NOT NULL,
    "year" INTEGER NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "t_man_hours_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "t_man_hours_month_year_idx" ON "t_man_hours"("month", "year");

-- CreateIndex
CREATE INDEX "t_man_hours_group_idx" ON "t_man_hours"("group");

-- CreateIndex
CREATE UNIQUE INDEX "t_man_hours_name_group_month_year_key" ON "t_man_hours"("name", "group", "month", "year");

-- AddForeignKey
ALTER TABLE "t_man_hours" ADD CONSTRAINT "t_man_hours_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "t_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
