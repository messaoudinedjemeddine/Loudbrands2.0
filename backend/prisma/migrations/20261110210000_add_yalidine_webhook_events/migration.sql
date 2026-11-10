-- CreateTable
CREATE TABLE "yalidine_webhook_events" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "tracking" TEXT,
    "occurredAt" TIMESTAMP(3),
    "data" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "yalidine_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "yalidine_webhook_events_eventId_key" ON "yalidine_webhook_events"("eventId");

-- CreateIndex
CREATE INDEX "yalidine_webhook_events_status_occurredAt_idx" ON "yalidine_webhook_events"("status", "occurredAt");

-- CreateIndex
CREATE INDEX "yalidine_webhook_events_tracking_idx" ON "yalidine_webhook_events"("tracking");

