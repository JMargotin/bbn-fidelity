-- AlterTable
ALTER TABLE "Customer" ADD COLUMN "pinHash" TEXT;
ALTER TABLE "Customer" ADD COLUMN "pinFailedAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Customer" ADD COLUMN "pinLockedUntil" TIMESTAMP(3);
