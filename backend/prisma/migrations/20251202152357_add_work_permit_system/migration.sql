-- CreateTable
CREATE TABLE "m_work_classification" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_work_classification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_heavy_equipment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_heavy_equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_tools" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_tools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_materials" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_machines" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_machines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT,
    "contactPerson" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_professions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_professions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_areas" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "officeId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_rooms" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "areaId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_guests" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "photoUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_guests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_work_permits" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "proposedStartDate" TIMESTAMP(3) NOT NULL,
    "proposedEndDate" TIMESTAMP(3) NOT NULL,
    "workStagesDescription" TEXT NOT NULL,
    "jobSafetyAnalysis" TEXT NOT NULL,
    "workRequirements" TEXT,
    "safetyGuideline" TEXT,
    "requireCourseVerification" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "t_work_permits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_work_permit_classifications" (
    "id" TEXT NOT NULL,
    "workPermitId" TEXT NOT NULL,
    "workClassificationId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "t_work_permit_classifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_work_permit_employees" (
    "id" TEXT NOT NULL,
    "workPermitId" TEXT NOT NULL,
    "userId" TEXT,
    "employeeName" TEXT,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "t_work_permit_employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_work_permit_heavy_equipment" (
    "id" TEXT NOT NULL,
    "workPermitId" TEXT NOT NULL,
    "heavyEquipmentId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "t_work_permit_heavy_equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_work_permit_tools" (
    "id" TEXT NOT NULL,
    "workPermitId" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "t_work_permit_tools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_work_permit_materials" (
    "id" TEXT NOT NULL,
    "workPermitId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "t_work_permit_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_work_permit_machines" (
    "id" TEXT NOT NULL,
    "workPermitId" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "t_work_permit_machines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_work_permit_workers" (
    "id" TEXT NOT NULL,
    "workPermitId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "idNumber" TEXT,
    "certificateUrl" TEXT,
    "healthDeclarationUrl" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "t_work_permit_workers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_work_permit_professions" (
    "id" TEXT NOT NULL,
    "workPermitId" TEXT NOT NULL,
    "professionId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "t_work_permit_professions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_work_permit_required_courses" (
    "id" TEXT NOT NULL,
    "workPermitId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_work_permit_required_courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_work_permit_hazards" (
    "id" TEXT NOT NULL,
    "workPermitId" TEXT NOT NULL,
    "hazardId" TEXT,
    "hazardName" TEXT NOT NULL,
    "description" TEXT,
    "controlMeasure" TEXT,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_work_permit_hazards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_work_permit_attachments" (
    "id" TEXT NOT NULL,
    "workPermitId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "t_work_permit_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_WorkPermitSupervisorToGuest" (
    "id" TEXT NOT NULL,
    "workPermitId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "_WorkPermitSupervisorToGuest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_WorkPermitToUser" (
    "id" TEXT NOT NULL,
    "workPermitId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "_WorkPermitToUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_WorkPermitToSafetyEquipment" (
    "id" TEXT NOT NULL,
    "workPermitId" TEXT NOT NULL,
    "safetyEquipmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "_WorkPermitToSafetyEquipment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "m_work_classification_code_key" ON "m_work_classification"("code");

-- CreateIndex
CREATE UNIQUE INDEX "m_heavy_equipment_code_key" ON "m_heavy_equipment"("code");

-- CreateIndex
CREATE UNIQUE INDEX "m_tools_code_key" ON "m_tools"("code");

-- CreateIndex
CREATE UNIQUE INDEX "m_materials_code_key" ON "m_materials"("code");

-- CreateIndex
CREATE UNIQUE INDEX "m_machines_code_key" ON "m_machines"("code");

-- CreateIndex
CREATE UNIQUE INDEX "m_companies_code_key" ON "m_companies"("code");

-- CreateIndex
CREATE UNIQUE INDEX "m_professions_code_key" ON "m_professions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "m_areas_code_key" ON "m_areas"("code");

-- CreateIndex
CREATE UNIQUE INDEX "m_rooms_code_key" ON "m_rooms"("code");

-- CreateIndex
CREATE UNIQUE INDEX "m_rooms_areaId_key" ON "m_rooms"("areaId");

-- CreateIndex
CREATE UNIQUE INDEX "t_work_permits_code_key" ON "t_work_permits"("code");

-- CreateIndex
CREATE UNIQUE INDEX "t_work_permit_required_courses_workPermitId_courseId_key" ON "t_work_permit_required_courses"("workPermitId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "_WorkPermitSupervisorToGuest_workPermitId_guestId_key" ON "_WorkPermitSupervisorToGuest"("workPermitId", "guestId");

-- CreateIndex
CREATE UNIQUE INDEX "_WorkPermitToUser_workPermitId_userId_key" ON "_WorkPermitToUser"("workPermitId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "_WorkPermitToSafetyEquipment_workPermitId_safetyEquipmentId_key" ON "_WorkPermitToSafetyEquipment"("workPermitId", "safetyEquipmentId");

-- AddForeignKey
ALTER TABLE "m_areas" ADD CONSTRAINT "m_areas_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "m_offices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_rooms" ADD CONSTRAINT "m_rooms_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "m_areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_work_permits" ADD CONSTRAINT "t_work_permits_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "m_areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_work_permits" ADD CONSTRAINT "t_work_permits_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "m_companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_work_permits" ADD CONSTRAINT "t_work_permits_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "t_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_work_permit_classifications" ADD CONSTRAINT "t_work_permit_classifications_workPermitId_fkey" FOREIGN KEY ("workPermitId") REFERENCES "t_work_permits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_work_permit_classifications" ADD CONSTRAINT "t_work_permit_classifications_workClassificationId_fkey" FOREIGN KEY ("workClassificationId") REFERENCES "m_work_classification"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_work_permit_employees" ADD CONSTRAINT "t_work_permit_employees_workPermitId_fkey" FOREIGN KEY ("workPermitId") REFERENCES "t_work_permits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_work_permit_employees" ADD CONSTRAINT "t_work_permit_employees_userId_fkey" FOREIGN KEY ("userId") REFERENCES "t_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_work_permit_heavy_equipment" ADD CONSTRAINT "t_work_permit_heavy_equipment_workPermitId_fkey" FOREIGN KEY ("workPermitId") REFERENCES "t_work_permits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_work_permit_heavy_equipment" ADD CONSTRAINT "t_work_permit_heavy_equipment_heavyEquipmentId_fkey" FOREIGN KEY ("heavyEquipmentId") REFERENCES "m_heavy_equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_work_permit_tools" ADD CONSTRAINT "t_work_permit_tools_workPermitId_fkey" FOREIGN KEY ("workPermitId") REFERENCES "t_work_permits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_work_permit_tools" ADD CONSTRAINT "t_work_permit_tools_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "m_tools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_work_permit_materials" ADD CONSTRAINT "t_work_permit_materials_workPermitId_fkey" FOREIGN KEY ("workPermitId") REFERENCES "t_work_permits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_work_permit_materials" ADD CONSTRAINT "t_work_permit_materials_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "m_materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_work_permit_machines" ADD CONSTRAINT "t_work_permit_machines_workPermitId_fkey" FOREIGN KEY ("workPermitId") REFERENCES "t_work_permits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_work_permit_machines" ADD CONSTRAINT "t_work_permit_machines_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "m_machines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_work_permit_workers" ADD CONSTRAINT "t_work_permit_workers_workPermitId_fkey" FOREIGN KEY ("workPermitId") REFERENCES "t_work_permits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_work_permit_workers" ADD CONSTRAINT "t_work_permit_workers_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "t_guests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_work_permit_professions" ADD CONSTRAINT "t_work_permit_professions_workPermitId_fkey" FOREIGN KEY ("workPermitId") REFERENCES "t_work_permits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_work_permit_professions" ADD CONSTRAINT "t_work_permit_professions_professionId_fkey" FOREIGN KEY ("professionId") REFERENCES "m_professions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_work_permit_required_courses" ADD CONSTRAINT "t_work_permit_required_courses_workPermitId_fkey" FOREIGN KEY ("workPermitId") REFERENCES "t_work_permits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_work_permit_required_courses" ADD CONSTRAINT "t_work_permit_required_courses_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "t_courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_work_permit_hazards" ADD CONSTRAINT "t_work_permit_hazards_workPermitId_fkey" FOREIGN KEY ("workPermitId") REFERENCES "t_work_permits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_work_permit_hazards" ADD CONSTRAINT "t_work_permit_hazards_hazardId_fkey" FOREIGN KEY ("hazardId") REFERENCES "m_threats"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_work_permit_attachments" ADD CONSTRAINT "t_work_permit_attachments_workPermitId_fkey" FOREIGN KEY ("workPermitId") REFERENCES "t_work_permits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_WorkPermitSupervisorToGuest" ADD CONSTRAINT "_WorkPermitSupervisorToGuest_workPermitId_fkey" FOREIGN KEY ("workPermitId") REFERENCES "t_work_permits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_WorkPermitSupervisorToGuest" ADD CONSTRAINT "_WorkPermitSupervisorToGuest_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "t_guests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_WorkPermitToUser" ADD CONSTRAINT "_WorkPermitToUser_workPermitId_fkey" FOREIGN KEY ("workPermitId") REFERENCES "t_work_permits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_WorkPermitToUser" ADD CONSTRAINT "_WorkPermitToUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "t_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_WorkPermitToSafetyEquipment" ADD CONSTRAINT "_WorkPermitToSafetyEquipment_workPermitId_fkey" FOREIGN KEY ("workPermitId") REFERENCES "t_work_permits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_WorkPermitToSafetyEquipment" ADD CONSTRAINT "_WorkPermitToSafetyEquipment_safetyEquipmentId_fkey" FOREIGN KEY ("safetyEquipmentId") REFERENCES "m_safety_equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
