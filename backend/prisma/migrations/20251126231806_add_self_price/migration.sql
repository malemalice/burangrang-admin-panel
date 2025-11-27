-- AlterTable
ALTER TABLE "t_products" ADD COLUMN     "isFreePrice" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxFreePrice" DECIMAL(10,2),
ADD COLUMN     "minFreePrice" DECIMAL(10,2) NOT NULL DEFAULT 1000;
