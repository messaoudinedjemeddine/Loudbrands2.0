-- CreateTable
CREATE TABLE "zakat_calculations" (
    "id" TEXT NOT NULL,
    "periodFrom" TIMESTAMP(3) NOT NULL,
    "periodTo" TIMESTAMP(3) NOT NULL,
    "stockValue" DOUBLE PRECISION NOT NULL,
    "salesValue" DOUBLE PRECISION NOT NULL,
    "ateliers" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "salaries" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "otherCharges" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "goldPricePerGram" DOUBLE PRECISION NOT NULL,
    "nisab" DOUBLE PRECISION NOT NULL,
    "base" DOUBLE PRECISION NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL DEFAULT 0.025,
    "zakatDue" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "zakat_calculations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "zakat_calculations_periodTo_idx" ON "zakat_calculations"("periodTo");

