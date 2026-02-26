-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PAID', 'PENDING', 'PARTIAL');

-- CreateTable
CREATE TABLE "ateliers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ateliers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ateliers_name_key" ON "ateliers"("name");

-- AlterTable: add atelierId (nullable until legacy data migrated), amountPaid
ALTER TABLE "stock_receptions" ADD COLUMN "atelierId" TEXT;
ALTER TABLE "stock_receptions" ADD COLUMN "amountPaid" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable: add unitCost to stock_reception_items
ALTER TABLE "stock_reception_items" ADD COLUMN "unitCost" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Migrate paymentStatus from TEXT to enum: add new column, copy data, drop old, rename
ALTER TABLE "stock_receptions" ADD COLUMN "paymentStatusNew" "PaymentStatus" DEFAULT 'PENDING';
UPDATE "stock_receptions" SET "paymentStatusNew" = CASE
    WHEN "paymentStatus" = 'PAID' THEN 'PAID'::"PaymentStatus"
    WHEN "paymentStatus" = 'PARTIAL' THEN 'PARTIAL'::"PaymentStatus"
    ELSE 'PENDING'::"PaymentStatus"
END;
ALTER TABLE "stock_receptions" DROP COLUMN "paymentStatus";
ALTER TABLE "stock_receptions" RENAME COLUMN "paymentStatusNew" TO "paymentStatus";
ALTER TABLE "stock_receptions" ALTER COLUMN "paymentStatus" SET NOT NULL;
ALTER TABLE "stock_receptions" ALTER COLUMN "paymentStatus" SET DEFAULT 'PENDING';

-- AddForeignKey (atelierId references ateliers; add after data migration script populates atelierId)
ALTER TABLE "stock_receptions" ADD CONSTRAINT "stock_receptions_atelierId_fkey" FOREIGN KEY ("atelierId") REFERENCES "ateliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
