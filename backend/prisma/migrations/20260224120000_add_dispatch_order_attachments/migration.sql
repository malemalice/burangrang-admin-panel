-- CreateTable
CREATE TABLE "t_dispatch_order_attachments" (
    "id" TEXT NOT NULL,
    "dispatchOrderId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "t_dispatch_order_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "t_dispatch_order_attachments_dispatchOrderId_idx" ON "t_dispatch_order_attachments"("dispatchOrderId");

-- CreateIndex
CREATE INDEX "t_dispatch_order_attachments_order_idx" ON "t_dispatch_order_attachments"("order");

-- AddForeignKey
ALTER TABLE "t_dispatch_order_attachments" ADD CONSTRAINT "t_dispatch_order_attachments_dispatchOrderId_fkey" FOREIGN KEY ("dispatchOrderId") REFERENCES "t_dispatch_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
