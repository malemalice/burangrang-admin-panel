-- CreateTable
CREATE TABLE "t_work_classification_attachments" (
    "id" TEXT NOT NULL,
    "workClassificationId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "t_work_classification_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "t_work_classification_attachments_workClassificationId_idx" ON "t_work_classification_attachments"("workClassificationId");

-- AddForeignKey
ALTER TABLE "t_work_classification_attachments" ADD CONSTRAINT "t_work_classification_attachments_workClassificationId_fkey" FOREIGN KEY ("workClassificationId") REFERENCES "m_work_classification"("id") ON DELETE CASCADE ON UPDATE CASCADE;
