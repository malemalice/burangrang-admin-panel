-- CreateTable
CREATE TABLE "m_hfacs_nodes" (
    "id" TEXT NOT NULL,
    "parentId" TEXT,
    "section" "InvestigationCauseSectionEnum" NOT NULL,
    "depth" INTEGER NOT NULL,
    "code" VARCHAR(32),
    "labelEn" VARCHAR(256) NOT NULL,
    "labelId" VARCHAR(256) NOT NULL,
    "isOther" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_hfacs_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "m_hfacs_nodes_parentId_order_idx" ON "m_hfacs_nodes"("parentId", "order");

-- CreateIndex
CREATE INDEX "m_hfacs_nodes_section_depth_idx" ON "m_hfacs_nodes"("section", "depth");

-- CreateIndex
CREATE INDEX "m_hfacs_nodes_code_idx" ON "m_hfacs_nodes"("code");

-- AlterTable
ALTER TABLE "t_investigation_causes" ADD COLUMN "hfacsNodeId" TEXT;

-- CreateIndex
CREATE INDEX "t_investigation_causes_hfacsNodeId_idx" ON "t_investigation_causes"("hfacsNodeId");

-- AddForeignKey
ALTER TABLE "m_hfacs_nodes" ADD CONSTRAINT "m_hfacs_nodes_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "m_hfacs_nodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_investigation_causes" ADD CONSTRAINT "t_investigation_causes_hfacsNodeId_fkey" FOREIGN KEY ("hfacsNodeId") REFERENCES "m_hfacs_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: link any existing t_investigation_causes row to a seeded node sharing the same causeKey.
-- The seed (hfacs-catalogue.seed.ts) populates m_hfacs_nodes with the original causeKeys (OC_001 etc.).
-- This statement is a no-op if the seed has not run yet; re-running it after the seed is safe.
UPDATE "t_investigation_causes" tc
SET "hfacsNodeId" = mn."id"
FROM "m_hfacs_nodes" mn
WHERE mn."code" = tc."causeKey"
  AND mn."deletedAt" IS NULL
  AND tc."hfacsNodeId" IS NULL;
