-- CreateEnum
CREATE TYPE "ContestTicketSource" AS ENUM ('FREE', 'PURCHASE');

-- CreateTable
CREATE TABLE "Contest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "prizeLabel" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "pointsPerTicket" INTEGER NOT NULL DEFAULT 5,
    "freeTickets" INTEGER NOT NULL DEFAULT 1,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContestEntry" (
    "id" TEXT NOT NULL,
    "contestId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "tickets" INTEGER NOT NULL DEFAULT 0,
    "pointsSpent" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContestEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContestTicketPurchase" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "pointsSpent" INTEGER NOT NULL,
    "source" "ContestTicketSource" NOT NULL DEFAULT 'PURCHASE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContestTicketPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContestDraw" (
    "id" TEXT NOT NULL,
    "contestId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "drawnAt" TIMESTAMP(3),
    "winnerEntryId" TEXT,
    "winnerTickets" INTEGER,
    "totalTickets" INTEGER,
    "winningTicket" INTEGER,

    CONSTRAINT "ContestDraw_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Contest_active_startsAt_idx" ON "Contest"("active", "startsAt");

-- CreateIndex
CREATE INDEX "ContestEntry_contestId_idx" ON "ContestEntry"("contestId");

-- CreateIndex
CREATE INDEX "ContestEntry_customerId_idx" ON "ContestEntry"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "ContestEntry_contestId_customerId_key" ON "ContestEntry"("contestId", "customerId");

-- CreateIndex
CREATE INDEX "ContestTicketPurchase_entryId_createdAt_idx" ON "ContestTicketPurchase"("entryId", "createdAt");

-- CreateIndex
CREATE INDEX "ContestDraw_contestId_scheduledFor_idx" ON "ContestDraw"("contestId", "scheduledFor");

-- CreateIndex
CREATE UNIQUE INDEX "ContestDraw_contestId_position_key" ON "ContestDraw"("contestId", "position");

-- AddForeignKey
ALTER TABLE "ContestEntry" ADD CONSTRAINT "ContestEntry_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "Contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContestEntry" ADD CONSTRAINT "ContestEntry_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContestTicketPurchase" ADD CONSTRAINT "ContestTicketPurchase_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "ContestEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContestDraw" ADD CONSTRAINT "ContestDraw_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "Contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContestDraw" ADD CONSTRAINT "ContestDraw_winnerEntryId_fkey" FOREIGN KEY ("winnerEntryId") REFERENCES "ContestEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
