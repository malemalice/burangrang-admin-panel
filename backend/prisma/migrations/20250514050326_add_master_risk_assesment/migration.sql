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

-- CreateIndex
CREATE UNIQUE INDEX "m_hse_categories_code_key" ON "m_hse_categories"("code");

-- CreateIndex
CREATE UNIQUE INDEX "m_threats_code_key" ON "m_threats"("code");

-- AddForeignKey
ALTER TABLE "m_threats" ADD CONSTRAINT "m_threats_hseCategoryId_fkey" FOREIGN KEY ("hseCategoryId") REFERENCES "m_hse_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_threat_mitigations" ADD CONSTRAINT "m_threat_mitigations_threatId_fkey" FOREIGN KEY ("threatId") REFERENCES "m_threats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
