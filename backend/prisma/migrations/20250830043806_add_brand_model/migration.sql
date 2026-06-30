/*
  Warnings:

  - A unique constraint covering the columns `[brandId,slug]` on the table `categories` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[brandId,slug]` on the table `products` will be added. If there are existing duplicate values, this will fail.

*/

-- CreateTable
CREATE TABLE "brands" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT,
    "description" TEXT,
    "descriptionAr" TEXT,
    "logo" TEXT,
    "slug" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "brands_name_key" ON "brands"("name");

-- CreateIndex
CREATE UNIQUE INDEX "brands_slug_key" ON "brands"("slug");

-- Insert default brands
INSERT INTO "brands" ("id", "name", "nameAr", "description", "descriptionAr", "slug", "isActive", "createdAt", "updatedAt") VALUES
('brand_loudim', 'LOUDIM', 'لوديم', 'Traditional Algerian fashion brand', 'علامة أزياء جزائرية تقليدية', 'loudim', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('brand_loud_styles', 'LOUD STYLES', 'لود ستايلز', 'Modern Algerian fashion brand', 'علامة أزياء جزائرية عصرية', 'loud-styles', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- DropIndex
DROP INDEX "categories_slug_key";

-- DropIndex
DROP INDEX "products_slug_key";

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "brandId" TEXT NOT NULL DEFAULT 'brand_loudim';

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "brandId" TEXT NOT NULL DEFAULT 'brand_loudim';

-- Remove default constraints
ALTER TABLE "categories" ALTER COLUMN "brandId" DROP DEFAULT;
ALTER TABLE "products" ALTER COLUMN "brandId" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "categories_brandId_slug_key" ON "categories"("brandId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "products_brandId_slug_key" ON "products"("brandId", "slug");

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;
