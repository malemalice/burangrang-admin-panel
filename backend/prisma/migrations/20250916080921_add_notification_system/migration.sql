-- CreateTable
CREATE TABLE "m_notification_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_notification_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_notifications" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "context" TEXT,
    "contextId" TEXT,
    "typeId" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "t_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_notification_recipients" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "userId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "t_notification_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "m_notification_types_name_key" ON "m_notification_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "t_notification_recipients_notificationId_roleId_userId_key" ON "t_notification_recipients"("notificationId", "roleId", "userId");

-- AddForeignKey
ALTER TABLE "t_notifications" ADD CONSTRAINT "t_notifications_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "m_notification_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_notifications" ADD CONSTRAINT "t_notifications_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "t_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_notification_recipients" ADD CONSTRAINT "t_notification_recipients_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "t_notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_notification_recipients" ADD CONSTRAINT "t_notification_recipients_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "m_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_notification_recipients" ADD CONSTRAINT "t_notification_recipients_userId_fkey" FOREIGN KEY ("userId") REFERENCES "t_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
