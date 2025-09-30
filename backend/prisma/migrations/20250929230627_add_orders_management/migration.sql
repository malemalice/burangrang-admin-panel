-- CreateTable
CREATE TABLE "t_customers" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "postalCode" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "gender" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_orders" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "subtotal" DECIMAL(10,2) NOT NULL,
    "taxAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "shippingAddress" TEXT,
    "billingAddress" TEXT,
    "notes" TEXT,
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_order_items" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT,
    "courseId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "totalPrice" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_payments" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "paymentMethodId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "gatewayResponse" JSONB,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_payment_methods" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_enrollments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "orderId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "progress" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "lastAccessedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_progress" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "timeSpent" INTEGER NOT NULL DEFAULT 0,
    "progress" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "lastAccessedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "t_customers_userId_key" ON "t_customers"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "t_orders_orderNumber_key" ON "t_orders"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "t_payments_transactionId_key" ON "t_payments"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "m_payment_methods_name_key" ON "m_payment_methods"("name");

-- CreateIndex
CREATE UNIQUE INDEX "m_payment_methods_code_key" ON "m_payment_methods"("code");

-- CreateIndex
CREATE UNIQUE INDEX "t_enrollments_userId_courseId_key" ON "t_enrollments"("userId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "t_progress_enrollmentId_chapterId_key" ON "t_progress"("enrollmentId", "chapterId");

-- AddForeignKey
ALTER TABLE "t_customers" ADD CONSTRAINT "t_customers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "t_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_orders" ADD CONSTRAINT "t_orders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "t_customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_order_items" ADD CONSTRAINT "t_order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "t_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_order_items" ADD CONSTRAINT "t_order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "t_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_order_items" ADD CONSTRAINT "t_order_items_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "t_courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_payments" ADD CONSTRAINT "t_payments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "t_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_payments" ADD CONSTRAINT "t_payments_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "m_payment_methods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_enrollments" ADD CONSTRAINT "t_enrollments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "t_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_enrollments" ADD CONSTRAINT "t_enrollments_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "t_courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_enrollments" ADD CONSTRAINT "t_enrollments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "t_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_progress" ADD CONSTRAINT "t_progress_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "t_enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_progress" ADD CONSTRAINT "t_progress_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "t_chapters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
