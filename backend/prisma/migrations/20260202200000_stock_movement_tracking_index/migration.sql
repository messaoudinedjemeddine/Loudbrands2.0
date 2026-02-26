-- CreateIndex: composite index for (trackingNumber, operationType) - scoped uniqueness lookup
CREATE INDEX IF NOT EXISTS "stock_movements_trackingNumber_operationType_idx" ON "stock_movements"("trackingNumber", "operationType");
