-- CreateTable
CREATE TABLE "t_zoho_webhook_logs" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "errorMessage" TEXT,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "t_zoho_webhook_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "t_zoho_webhook_logs_requestId_key" ON "t_zoho_webhook_logs"("requestId");

-- CreateIndex
CREATE INDEX "t_zoho_webhook_logs_requestId_idx" ON "t_zoho_webhook_logs"("requestId");

-- CreateIndex
CREATE INDEX "t_zoho_webhook_logs_eventType_idx" ON "t_zoho_webhook_logs"("eventType");

-- CreateIndex
CREATE INDEX "t_zoho_webhook_logs_status_idx" ON "t_zoho_webhook_logs"("status");

-- CreateIndex
CREATE INDEX "t_zoho_webhook_logs_processedAt_idx" ON "t_zoho_webhook_logs"("processedAt");
