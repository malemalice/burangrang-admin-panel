-- CreateEnum
CREATE TYPE "RiskRatingEnum" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'EXTREME');

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
CREATE TABLE "m_hse_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_hse_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_threats" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "hseCategoryId" TEXT NOT NULL,

    CONSTRAINT "m_threats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_threat_mitigations" (
    "id" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "mitigationDescription" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "threatId" TEXT NOT NULL,

    CONSTRAINT "m_threat_mitigations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_risk_matrix" (
    "id" TEXT NOT NULL,
    "likelihoodLevel" INTEGER NOT NULL,
    "consequenceLevel" INTEGER NOT NULL,
    "risk_rating" "RiskRatingEnum" NOT NULL,

    CONSTRAINT "m_risk_matrix_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_risk_assessment" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "departmentId" TEXT NOT NULL,
    "assessmentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "assigneeId" TEXT,
    "actionPlan" TEXT,

    CONSTRAINT "t_risk_assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_risk_assessment_item" (
    "id" TEXT NOT NULL,
    "riskAssessmentId" TEXT NOT NULL,
    "mThreatId" TEXT NOT NULL,
    "mHseCategoryId" TEXT NOT NULL,
    "likelihoodLevel" INTEGER NOT NULL,
    "consequenceLevel" INTEGER NOT NULL,
    "riskMatrixRating" "RiskRatingEnum" NOT NULL,

    CONSTRAINT "t_risk_assessment_item_pkey" PRIMARY KEY ("id")
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
CREATE UNIQUE INDEX "m_hse_categories_code_key" ON "m_hse_categories"("code");

-- CreateIndex
CREATE UNIQUE INDEX "m_threats_code_key" ON "m_threats"("code");

-- CreateIndex
CREATE UNIQUE INDEX "t_risk_assessment_code_key" ON "t_risk_assessment"("code");

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
ALTER TABLE "m_threats" ADD CONSTRAINT "m_threats_hseCategoryId_fkey" FOREIGN KEY ("hseCategoryId") REFERENCES "m_hse_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_threat_mitigations" ADD CONSTRAINT "m_threat_mitigations_threatId_fkey" FOREIGN KEY ("threatId") REFERENCES "m_threats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_risk_assessment" ADD CONSTRAINT "t_risk_assessment_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_risk_assessment" ADD CONSTRAINT "t_risk_assessment_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_risk_assessment_item" ADD CONSTRAINT "t_risk_assessment_item_riskAssessmentId_fkey" FOREIGN KEY ("riskAssessmentId") REFERENCES "t_risk_assessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_risk_assessment_item" ADD CONSTRAINT "t_risk_assessment_item_mThreatId_fkey" FOREIGN KEY ("mThreatId") REFERENCES "m_threats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_risk_assessment_item" ADD CONSTRAINT "t_risk_assessment_item_mHseCategoryId_fkey" FOREIGN KEY ("mHseCategoryId") REFERENCES "m_hse_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
