-- CreateEnum
CREATE TYPE "EscalationEventType" AS ENUM ('TRIGGERED', 'ADVANCED', 'ACKNOWLEDGED', 'RESOLVED');

-- CreateTable
CREATE TABLE "EscalationContact" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "timeoutSeconds" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EscalationContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EscalationLog" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "eventType" "EscalationEventType" NOT NULL,
    "reason" TEXT,
    "ackReceived" BOOLEAN NOT NULL DEFAULT false,
    "acknowledgedAt" TIMESTAMP(3),
    "acknowledgedById" TEXT,
    "ackNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EscalationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EscalationContact_userId_idx" ON "EscalationContact"("userId");

-- CreateIndex
CREATE INDEX "EscalationContact_position_idx" ON "EscalationContact"("position");

-- CreateIndex
CREATE INDEX "EscalationLog_workOrderId_idx" ON "EscalationLog"("workOrderId");

-- CreateIndex
CREATE INDEX "EscalationLog_contactId_idx" ON "EscalationLog"("contactId");

-- CreateIndex
CREATE INDEX "EscalationLog_ackReceived_idx" ON "EscalationLog"("ackReceived");

-- CreateIndex
CREATE INDEX "EscalationLog_createdAt_idx" ON "EscalationLog"("createdAt");

-- AddForeignKey
ALTER TABLE "EscalationContact" ADD CONSTRAINT "EscalationContact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EscalationLog" ADD CONSTRAINT "EscalationLog_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EscalationLog" ADD CONSTRAINT "EscalationLog_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "EscalationContact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EscalationLog" ADD CONSTRAINT "EscalationLog_acknowledgedById_fkey" FOREIGN KEY ("acknowledgedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
