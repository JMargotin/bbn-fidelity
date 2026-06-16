-- CreateTable
CREATE TABLE "PassDevice" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "deviceLibraryIdentifier" TEXT NOT NULL,
    "pushToken" TEXT NOT NULL,
    "passTypeIdentifier" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PassDevice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PassDevice_serialNumber_idx" ON "PassDevice"("serialNumber");

-- CreateIndex
CREATE INDEX "PassDevice_customerId_idx" ON "PassDevice"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "PassDevice_deviceLibraryIdentifier_passTypeIdentifier_seria_key" ON "PassDevice"("deviceLibraryIdentifier", "passTypeIdentifier", "serialNumber");

-- AddForeignKey
ALTER TABLE "PassDevice" ADD CONSTRAINT "PassDevice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
