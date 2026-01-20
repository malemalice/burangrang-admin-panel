-- CreateEnum
CREATE TYPE "CompliantStatusEnum" AS ENUM ('COMPLY', 'NOT_COMPLY_MAJOR', 'NOT_COMPLY_MINOR');

-- CreateTable
CREATE TABLE "t_audits" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "auditDate" TIMESTAMP(3) NOT NULL,
    "auditElementId" TEXT NOT NULL,
    "status" "GeneralStatusEnum" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "t_audits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_audit_items" (
    "id" TEXT NOT NULL,
    "auditId" TEXT NOT NULL,
    "auditCriteriaId" TEXT NOT NULL,
    "status" "GeneralStatusEnum" NOT NULL DEFAULT 'OPEN',
    "compliantStatus" "CompliantStatusEnum" NOT NULL,
    "evidence" TEXT,
    "recommendation" TEXT,
    "actionRealization" TEXT,
    "order" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_audit_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_audit_images" (
    "id" TEXT NOT NULL,
    "auditItemId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "caption" TEXT,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "t_audit_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AuditItemToDepartment" (
    "id" TEXT NOT NULL,
    "auditItemId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "_AuditItemToDepartment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AuditItemToUser" (
    "id" TEXT NOT NULL,
    "auditItemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "_AuditItemToUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AuditToArea" (
    "id" TEXT NOT NULL,
    "auditId" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "_AuditToArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AuditToUser" (
    "id" TEXT NOT NULL,
    "auditId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "_AuditToUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "t_audits_code_key" ON "t_audits"("code");

-- CreateIndex
CREATE INDEX "t_audits_auditElementId_idx" ON "t_audits"("auditElementId");

-- CreateIndex
CREATE INDEX "t_audits_status_idx" ON "t_audits"("status");

-- CreateIndex
CREATE INDEX "t_audit_items_auditId_idx" ON "t_audit_items"("auditId");

-- CreateIndex
CREATE INDEX "t_audit_items_auditCriteriaId_idx" ON "t_audit_items"("auditCriteriaId");

-- CreateIndex
CREATE INDEX "t_audit_items_status_idx" ON "t_audit_items"("status");

-- CreateIndex
CREATE INDEX "t_audit_images_auditItemId_idx" ON "t_audit_images"("auditItemId");

-- CreateIndex
CREATE INDEX "t_audit_images_order_idx" ON "t_audit_images"("order");

-- CreateIndex
CREATE INDEX "_AuditItemToDepartment_auditItemId_idx" ON "_AuditItemToDepartment"("auditItemId");

-- CreateIndex
CREATE INDEX "_AuditItemToDepartment_departmentId_idx" ON "_AuditItemToDepartment"("departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "_AuditItemToDepartment_auditItemId_departmentId_key" ON "_AuditItemToDepartment"("auditItemId", "departmentId");

-- CreateIndex
CREATE INDEX "_AuditItemToUser_auditItemId_idx" ON "_AuditItemToUser"("auditItemId");

-- CreateIndex
CREATE INDEX "_AuditItemToUser_userId_idx" ON "_AuditItemToUser"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "_AuditItemToUser_auditItemId_userId_key" ON "_AuditItemToUser"("auditItemId", "userId");

-- CreateIndex
CREATE INDEX "_AuditToArea_auditId_idx" ON "_AuditToArea"("auditId");

-- CreateIndex
CREATE INDEX "_AuditToArea_areaId_idx" ON "_AuditToArea"("areaId");

-- CreateIndex
CREATE UNIQUE INDEX "_AuditToArea_auditId_areaId_key" ON "_AuditToArea"("auditId", "areaId");

-- CreateIndex
CREATE INDEX "_AuditToUser_auditId_idx" ON "_AuditToUser"("auditId");

-- CreateIndex
CREATE INDEX "_AuditToUser_userId_idx" ON "_AuditToUser"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "_AuditToUser_auditId_userId_key" ON "_AuditToUser"("auditId", "userId");

-- AddForeignKey
ALTER TABLE "t_audits" ADD CONSTRAINT "t_audits_auditElementId_fkey" FOREIGN KEY ("auditElementId") REFERENCES "m_audit_element"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_audits" ADD CONSTRAINT "t_audits_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "t_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_audit_items" ADD CONSTRAINT "t_audit_items_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "t_audits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_audit_items" ADD CONSTRAINT "t_audit_items_auditCriteriaId_fkey" FOREIGN KEY ("auditCriteriaId") REFERENCES "m_audit_criteria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_audit_images" ADD CONSTRAINT "t_audit_images_auditItemId_fkey" FOREIGN KEY ("auditItemId") REFERENCES "t_audit_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AuditItemToDepartment" ADD CONSTRAINT "_AuditItemToDepartment_auditItemId_fkey" FOREIGN KEY ("auditItemId") REFERENCES "t_audit_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AuditItemToDepartment" ADD CONSTRAINT "_AuditItemToDepartment_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "m_departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AuditItemToUser" ADD CONSTRAINT "_AuditItemToUser_auditItemId_fkey" FOREIGN KEY ("auditItemId") REFERENCES "t_audit_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AuditItemToUser" ADD CONSTRAINT "_AuditItemToUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "t_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AuditToArea" ADD CONSTRAINT "_AuditToArea_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "t_audits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AuditToArea" ADD CONSTRAINT "_AuditToArea_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "m_areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AuditToUser" ADD CONSTRAINT "_AuditToUser_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "t_audits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AuditToUser" ADD CONSTRAINT "_AuditToUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "t_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
