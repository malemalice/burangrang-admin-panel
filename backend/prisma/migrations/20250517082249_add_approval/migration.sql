-- CreateTable
CREATE TABLE "m_approval" (
    "id" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "m_approval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_approval_item" (
    "id" TEXT NOT NULL,
    "mApprovalId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "role_id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "m_approval_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approvals" (
    "id" TEXT NOT NULL,
    "mApprovalId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "approvals_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "m_approval_item" ADD CONSTRAINT "m_approval_item_mApprovalId_fkey" FOREIGN KEY ("mApprovalId") REFERENCES "m_approval"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_approval_item" ADD CONSTRAINT "m_approval_item_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_approval_item" ADD CONSTRAINT "m_approval_item_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_approval_item" ADD CONSTRAINT "m_approval_item_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
