/*
  Warnings:

  - You are about to drop the `approvals` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "approvals" DROP CONSTRAINT "approvals_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "approvals" DROP CONSTRAINT "approvals_department_id_fkey";

-- DropForeignKey
ALTER TABLE "approvals" DROP CONSTRAINT "approvals_role_id_fkey";

-- DropTable
DROP TABLE "approvals";

-- CreateTable
CREATE TABLE "t_approvals" (
    "id" TEXT NOT NULL,
    "mApprovalId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "t_approvals_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "t_approvals" ADD CONSTRAINT "t_approvals_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_approvals" ADD CONSTRAINT "t_approvals_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_approvals" ADD CONSTRAINT "t_approvals_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
