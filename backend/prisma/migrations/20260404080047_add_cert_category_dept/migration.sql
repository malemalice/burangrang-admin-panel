-- CreateTable
CREATE TABLE "_CertificateCategoryResponsibleDepartments" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CertificateCategoryResponsibleDepartments_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_CertificateCategoryResponsibleDepartments_B_index" ON "_CertificateCategoryResponsibleDepartments"("B");

-- AddForeignKey
ALTER TABLE "_CertificateCategoryResponsibleDepartments" ADD CONSTRAINT "_CertificateCategoryResponsibleDepartments_A_fkey" FOREIGN KEY ("A") REFERENCES "m_certificate_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CertificateCategoryResponsibleDepartments" ADD CONSTRAINT "_CertificateCategoryResponsibleDepartments_B_fkey" FOREIGN KEY ("B") REFERENCES "m_departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
