CREATE TABLE IF NOT EXISTS stock_movements (
    id TEXT NOT NULL,
    type TEXT NOT NULL,
    barcode TEXT,
    "productName" TEXT NOT NULL,
    "productReference" TEXT,
    size TEXT,
    quantity INTEGER NOT NULL,
    "oldStock" INTEGER,
    "newStock" INTEGER,
    "orderNumber" TEXT,
    "trackingNumber" TEXT,
    notes TEXT,
    "operationType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT stock_movements_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS stock_movements_createdAt_idx ON stock_movements("createdAt");
CREATE INDEX IF NOT EXISTS stock_movements_type_idx ON stock_movements(type);
CREATE INDEX IF NOT EXISTS stock_movements_operationType_idx ON stock_movements("operationType");
