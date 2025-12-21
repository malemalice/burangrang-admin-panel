-- AlterEnum
ALTER TYPE "ReminderRepeatTypeEnum" ADD VALUE 'DAILY';

-- DropIndex
DROP INDEX "public"."t_certificates_certificateNumber_key";
