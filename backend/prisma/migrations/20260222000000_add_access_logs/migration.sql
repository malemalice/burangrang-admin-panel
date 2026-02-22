-- CreateTable
CREATE TABLE "t_access_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "method" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "statusCode" INTEGER,
    "payload" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "executionTime" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "t_access_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "t_access_logs_userId_idx" ON "t_access_logs"("userId");

-- CreateIndex
CREATE INDEX "t_access_logs_endpoint_idx" ON "t_access_logs"("endpoint");

-- CreateIndex
CREATE INDEX "t_access_logs_method_idx" ON "t_access_logs"("method");

-- CreateIndex
CREATE INDEX "t_access_logs_createdAt_idx" ON "t_access_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "t_access_logs" ADD CONSTRAINT "t_access_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "t_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
