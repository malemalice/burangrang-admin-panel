-- CreateEnum
CREATE TYPE "CertificateTypeEnum" AS ENUM ('PERSONNEL_LICENSE', 'PERSONNEL_CERTIFICATE', 'EQUIPMENT_CALIBRATION', 'EQUIPMENT_INSTALLATION', 'EQUIPMENT_OPERATIONAL_PERMIT');

-- CreateEnum
CREATE TYPE "CertificateRenewalStatusEnum" AS ENUM ('PENDING', 'REQUESTED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'EXPIRED');

-- CreateTable
CREATE TABLE "m_certificate_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "certificateType" "CertificateTypeEnum" NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_certificate_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_certificates" (
    "id" TEXT NOT NULL,
    "certificateNumber" TEXT NOT NULL,
    "certificateName" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "certificateType" "CertificateTypeEnum" NOT NULL,
    "issuedDate" TIMESTAMP(3) NOT NULL,
    "validityDate" TIMESTAMP(3) NOT NULL,
    "issuerName" TEXT NOT NULL,
    "documentUrl" TEXT,
    "personnelId" TEXT,
    "personnelName" TEXT,
    "equipmentId" TEXT,
    "equipmentName" TEXT,
    "departmentId" TEXT NOT NULL,
    "reminderDays" INTEGER NOT NULL DEFAULT 30,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "t_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_certificate_renewals" (
    "id" TEXT NOT NULL,
    "certificateId" TEXT NOT NULL,
    "requestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requestedBy" TEXT NOT NULL,
    "status" "CertificateRenewalStatusEnum" NOT NULL DEFAULT 'PENDING',
    "processedBy" TEXT,
    "processedDate" TIMESTAMP(3),
    "newValidityDate" TIMESTAMP(3),
    "newDocumentUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_certificate_renewals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_certificate_reminders" (
    "id" TEXT NOT NULL,
    "certificateId" TEXT NOT NULL,
    "reminderDate" TIMESTAMP(3) NOT NULL,
    "isSent" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3),
    "recipientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "t_certificate_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "m_certificate_categories_code_key" ON "m_certificate_categories"("code");

-- CreateIndex
CREATE UNIQUE INDEX "t_certificates_certificateNumber_key" ON "t_certificates"("certificateNumber");

-- AddForeignKey
ALTER TABLE "t_certificates" ADD CONSTRAINT "t_certificates_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "m_certificate_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_certificates" ADD CONSTRAINT "t_certificates_personnelId_fkey" FOREIGN KEY ("personnelId") REFERENCES "t_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_certificates" ADD CONSTRAINT "t_certificates_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "m_departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_certificates" ADD CONSTRAINT "t_certificates_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "t_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_certificate_renewals" ADD CONSTRAINT "t_certificate_renewals_certificateId_fkey" FOREIGN KEY ("certificateId") REFERENCES "t_certificates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_certificate_renewals" ADD CONSTRAINT "t_certificate_renewals_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "t_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_certificate_renewals" ADD CONSTRAINT "t_certificate_renewals_processedBy_fkey" FOREIGN KEY ("processedBy") REFERENCES "t_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_certificate_reminders" ADD CONSTRAINT "t_certificate_reminders_certificateId_fkey" FOREIGN KEY ("certificateId") REFERENCES "t_certificates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_certificate_reminders" ADD CONSTRAINT "t_certificate_reminders_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "t_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
