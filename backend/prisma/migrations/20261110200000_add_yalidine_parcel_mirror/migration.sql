-- AlterEnum
ALTER TYPE "DeliveryStatus" ADD VALUE 'RETURNED';

-- CreateTable
CREATE TABLE "yalidine_parcels" (
    "id" TEXT NOT NULL,
    "tracking" TEXT NOT NULL,
    "orderId" TEXT,
    "yalidineOrderId" TEXT,
    "lastStatus" TEXT,
    "lastStatusReason" TEXT,
    "lastStatusAt" TIMESTAMP(3),
    "paymentStatus" TEXT,
    "paymentId" TEXT,
    "isStopdesk" BOOLEAN NOT NULL DEFAULT false,
    "stopdeskId" INTEGER,
    "stopdeskName" TEXT,
    "toWilayaId" INTEGER,
    "toWilayaName" TEXT,
    "toCommuneName" TEXT,
    "currentCenterName" TEXT,
    "currentWilayaName" TEXT,
    "productList" TEXT,
    "price" INTEGER,
    "deliveryFee" INTEGER,
    "freeshipping" BOOLEAN NOT NULL DEFAULT false,
    "hasExchange" BOOLEAN NOT NULL DEFAULT false,
    "label" TEXT,
    "importId" INTEGER,
    "dateCreation" TIMESTAMP(3),
    "dateExpedition" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "yalidine_parcels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "yalidine_status_history" (
    "id" TEXT NOT NULL,
    "tracking" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reason" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "centerName" TEXT,
    "wilayaName" TEXT,
    "communeName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "yalidine_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "yalidine_parcels_tracking_key" ON "yalidine_parcels"("tracking");

-- CreateIndex
CREATE UNIQUE INDEX "yalidine_parcels_orderId_key" ON "yalidine_parcels"("orderId");

-- CreateIndex
CREATE INDEX "yalidine_parcels_lastStatus_idx" ON "yalidine_parcels"("lastStatus");

-- CreateIndex
CREATE INDEX "yalidine_parcels_paymentStatus_idx" ON "yalidine_parcels"("paymentStatus");

-- CreateIndex
CREATE INDEX "yalidine_parcels_lastStatusAt_idx" ON "yalidine_parcels"("lastStatusAt");

-- CreateIndex
CREATE INDEX "yalidine_parcels_yalidineOrderId_idx" ON "yalidine_parcels"("yalidineOrderId");

-- CreateIndex
CREATE INDEX "yalidine_status_history_tracking_occurredAt_idx" ON "yalidine_status_history"("tracking", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "yalidine_status_history_tracking_status_occurredAt_key" ON "yalidine_status_history"("tracking", "status", "occurredAt");

-- AddForeignKey
ALTER TABLE "yalidine_parcels" ADD CONSTRAINT "yalidine_parcels_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yalidine_status_history" ADD CONSTRAINT "yalidine_status_history_tracking_fkey" FOREIGN KEY ("tracking") REFERENCES "yalidine_parcels"("tracking") ON DELETE CASCADE ON UPDATE CASCADE;

