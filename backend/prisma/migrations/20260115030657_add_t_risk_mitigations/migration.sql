-- CreateTable
CREATE TABLE "t_risk_mitigation" (
    "id" TEXT NOT NULL,
    "eliminate" TEXT,
    "transfer" TEXT,
    "reduce" TEXT,
    "accept" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_risk_mitigation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "t_risk_mitigation_entity_entityId_idx" ON "t_risk_mitigation"("entity", "entityId");

-- CreateIndex
CREATE INDEX "t_risk_mitigation_isActive_idx" ON "t_risk_mitigation"("isActive");
