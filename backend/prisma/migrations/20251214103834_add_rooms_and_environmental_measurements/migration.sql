-- CreateTable
CREATE TABLE "t_environmental_measurements" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "lighting" DECIMAL(10,2),
    "noise" DECIMAL(10,2),
    "humidity" DECIMAL(10,2),
    "temperature" DECIMAL(10,2),
    "remarks" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "t_environmental_measurements_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "t_environmental_measurements" ADD CONSTRAINT "t_environmental_measurements_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "m_rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_environmental_measurements" ADD CONSTRAINT "t_environmental_measurements_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "t_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
