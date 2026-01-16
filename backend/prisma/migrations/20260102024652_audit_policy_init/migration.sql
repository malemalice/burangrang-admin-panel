-- CreateEnum
CREATE TYPE "TransitionTypeEnum" AS ENUM ('INITIAL', 'TRANSITION_LEVEL', 'ADVANCE_LEVEL');

-- CreateTable
CREATE TABLE "m_audit_element" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_audit_element_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_audit_clause" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "auditElementId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_audit_clause_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_audit_criteria" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "auditClauseId" TEXT NOT NULL,
    "transitionType" "TransitionTypeEnum" NOT NULL,
    "order" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_audit_criteria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "m_audit_element_code_key" ON "m_audit_element"("code");

-- CreateIndex
CREATE UNIQUE INDEX "m_audit_clause_code_key" ON "m_audit_clause"("code");

-- CreateIndex
CREATE INDEX "m_audit_clause_auditElementId_idx" ON "m_audit_clause"("auditElementId");

-- CreateIndex
CREATE INDEX "m_audit_clause_order_idx" ON "m_audit_clause"("order");

-- CreateIndex
CREATE UNIQUE INDEX "m_audit_criteria_code_key" ON "m_audit_criteria"("code");

-- CreateIndex
CREATE INDEX "m_audit_criteria_auditClauseId_idx" ON "m_audit_criteria"("auditClauseId");

-- CreateIndex
CREATE INDEX "m_audit_criteria_order_idx" ON "m_audit_criteria"("order");

-- AddForeignKey
ALTER TABLE "m_audit_clause" ADD CONSTRAINT "m_audit_clause_auditElementId_fkey" FOREIGN KEY ("auditElementId") REFERENCES "m_audit_element"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_audit_criteria" ADD CONSTRAINT "m_audit_criteria_auditClauseId_fkey" FOREIGN KEY ("auditClauseId") REFERENCES "m_audit_clause"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
