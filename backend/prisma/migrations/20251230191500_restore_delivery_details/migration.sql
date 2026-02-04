-- AlterTable
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "deliveryDetails" JSONB;
