-- Ensure paymentStatus is TEXT (fixes Prisma error when DB had enum or different type)
-- Safe if column is already TEXT (no-op); converts enum to TEXT if needed
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stock_receptions') THEN
    ALTER TABLE "stock_receptions" ALTER COLUMN "paymentStatus" TYPE TEXT USING "paymentStatus"::TEXT;
  END IF;
END $$;
