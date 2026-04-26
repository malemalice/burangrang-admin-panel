-- AlterTable
ALTER TABLE "t_users" ADD COLUMN "professionId" TEXT,
ADD COLUMN "idNumber" TEXT;

-- AddForeignKey
ALTER TABLE "t_users" ADD CONSTRAINT "t_users_professionId_fkey" FOREIGN KEY ("professionId") REFERENCES "m_professions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
