-- CreateTable
CREATE TABLE "t_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "roleId" TEXT NOT NULL,
    "officeId" TEXT NOT NULL,
    "departmentId" TEXT,
    "jobPositionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "t_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_refresh_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "t_refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_permissions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_menus" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "path" TEXT,
    "icon" TEXT,
    "parentId" TEXT,
    "order" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_menus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_offices" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "parentId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_offices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_departments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "m_departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_job_positions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "m_job_positions_pkey" PRIMARY KEY ("id")
);

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
    "job_position_id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "m_approval_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_approvals" (
    "id" TEXT NOT NULL,
    "mApprovalId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "job_position_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "t_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_PermissionToRole" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PermissionToRole_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_MenuToRole" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_MenuToRole_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "t_users_email_key" ON "t_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "t_refresh_tokens_token_key" ON "t_refresh_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "m_roles_name_key" ON "m_roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "m_permissions_name_key" ON "m_permissions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "m_offices_code_key" ON "m_offices"("code");

-- CreateIndex
CREATE UNIQUE INDEX "m_departments_code_key" ON "m_departments"("code");

-- CreateIndex
CREATE UNIQUE INDEX "m_job_positions_code_key" ON "m_job_positions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "m_settings_key_key" ON "m_settings"("key");

-- CreateIndex
CREATE INDEX "_PermissionToRole_B_index" ON "_PermissionToRole"("B");

-- CreateIndex
CREATE INDEX "_MenuToRole_B_index" ON "_MenuToRole"("B");

-- AddForeignKey
ALTER TABLE "t_users" ADD CONSTRAINT "t_users_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "m_offices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_users" ADD CONSTRAINT "t_users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "m_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_users" ADD CONSTRAINT "t_users_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "m_departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_users" ADD CONSTRAINT "t_users_jobPositionId_fkey" FOREIGN KEY ("jobPositionId") REFERENCES "m_job_positions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_refresh_tokens" ADD CONSTRAINT "t_refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "t_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_menus" ADD CONSTRAINT "m_menus_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "m_menus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_offices" ADD CONSTRAINT "m_offices_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "m_offices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_approval_item" ADD CONSTRAINT "m_approval_item_mApprovalId_fkey" FOREIGN KEY ("mApprovalId") REFERENCES "m_approval"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_approval_item" ADD CONSTRAINT "m_approval_item_job_position_id_fkey" FOREIGN KEY ("job_position_id") REFERENCES "m_job_positions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_approval_item" ADD CONSTRAINT "m_approval_item_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "m_departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_approval_item" ADD CONSTRAINT "m_approval_item_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "t_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_approvals" ADD CONSTRAINT "t_approvals_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "m_departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_approvals" ADD CONSTRAINT "t_approvals_job_position_id_fkey" FOREIGN KEY ("job_position_id") REFERENCES "m_job_positions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_approvals" ADD CONSTRAINT "t_approvals_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "t_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PermissionToRole" ADD CONSTRAINT "_PermissionToRole_A_fkey" FOREIGN KEY ("A") REFERENCES "m_permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PermissionToRole" ADD CONSTRAINT "_PermissionToRole_B_fkey" FOREIGN KEY ("B") REFERENCES "m_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MenuToRole" ADD CONSTRAINT "_MenuToRole_A_fkey" FOREIGN KEY ("A") REFERENCES "m_menus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MenuToRole" ADD CONSTRAINT "_MenuToRole_B_fkey" FOREIGN KEY ("B") REFERENCES "m_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
