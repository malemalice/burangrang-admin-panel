-- CreateTable
CREATE TABLE "t_inspections" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    "inspectionDate" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "status" "GeneralStatusEnum" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "t_inspections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_inspection_items" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "riskCategoryId" TEXT NOT NULL,
    "riskId" TEXT NOT NULL,
    "assignedDepartmentId" TEXT NOT NULL,
    "assigneeId" TEXT,
    "followUpNotes" TEXT,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_inspection_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_inspection_images" (
    "id" TEXT NOT NULL,
    "inspectionItemId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "caption" TEXT,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "t_inspection_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_inspection_inspectors" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "inspectorId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "t_inspection_inspectors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "t_inspections_code_key" ON "t_inspections"("code");

-- CreateIndex
CREATE INDEX "t_inspections_areaId_idx" ON "t_inspections"("areaId");

-- CreateIndex
CREATE INDEX "t_inspections_status_idx" ON "t_inspections"("status");

-- CreateIndex
CREATE INDEX "t_inspection_items_inspectionId_idx" ON "t_inspection_items"("inspectionId");

-- CreateIndex
CREATE INDEX "t_inspection_items_riskCategoryId_idx" ON "t_inspection_items"("riskCategoryId");

-- CreateIndex
CREATE INDEX "t_inspection_items_riskId_idx" ON "t_inspection_items"("riskId");

-- CreateIndex
CREATE INDEX "t_inspection_items_assignedDepartmentId_idx" ON "t_inspection_items"("assignedDepartmentId");

-- CreateIndex
CREATE INDEX "t_inspection_items_assigneeId_idx" ON "t_inspection_items"("assigneeId");

-- CreateIndex
CREATE INDEX "t_inspection_images_inspectionItemId_idx" ON "t_inspection_images"("inspectionItemId");

-- CreateIndex
CREATE INDEX "t_inspection_images_order_idx" ON "t_inspection_images"("order");

-- CreateIndex
CREATE INDEX "t_inspection_inspectors_inspectionId_idx" ON "t_inspection_inspectors"("inspectionId");

-- CreateIndex
CREATE INDEX "t_inspection_inspectors_inspectorId_idx" ON "t_inspection_inspectors"("inspectorId");

-- AddForeignKey
ALTER TABLE "t_inspections" ADD CONSTRAINT "t_inspections_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "m_areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_inspections" ADD CONSTRAINT "t_inspections_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "t_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_inspection_items" ADD CONSTRAINT "t_inspection_items_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "t_inspections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_inspection_items" ADD CONSTRAINT "t_inspection_items_riskCategoryId_fkey" FOREIGN KEY ("riskCategoryId") REFERENCES "m_risk_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_inspection_items" ADD CONSTRAINT "t_inspection_items_riskId_fkey" FOREIGN KEY ("riskId") REFERENCES "m_risk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_inspection_items" ADD CONSTRAINT "t_inspection_items_assignedDepartmentId_fkey" FOREIGN KEY ("assignedDepartmentId") REFERENCES "m_departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_inspection_items" ADD CONSTRAINT "t_inspection_items_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "t_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_inspection_images" ADD CONSTRAINT "t_inspection_images_inspectionItemId_fkey" FOREIGN KEY ("inspectionItemId") REFERENCES "t_inspection_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_inspection_inspectors" ADD CONSTRAINT "t_inspection_inspectors_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "t_inspections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_inspection_inspectors" ADD CONSTRAINT "t_inspection_inspectors_inspectorId_fkey" FOREIGN KEY ("inspectorId") REFERENCES "t_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
