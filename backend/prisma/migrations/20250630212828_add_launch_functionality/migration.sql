-- AlterTable
ALTER TABLE "products" ADD COLUMN     "isLaunch" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "launchAt" TIMESTAMP(3);
