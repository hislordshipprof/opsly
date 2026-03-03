-- CreateEnum
CREATE TYPE "ScheduleStatus" AS ENUM ('PLANNED', 'ACTIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "StopStatus" AS ENUM ('PENDING', 'EN_ROUTE', 'ARRIVED', 'COMPLETED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "AgentChannel" AS ENUM ('CHAT', 'VOICE');

-- CreateEnum
CREATE TYPE "AgentSessionStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ERROR');

-- CreateTable
CREATE TABLE "AgentSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "role" TEXT NOT NULL,
    "channel" "AgentChannel" NOT NULL,
    "linkedWorkOrderId" TEXT,
    "geminiSessionId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "status" "AgentSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastAgentName" TEXT,
    "transcript" JSONB,
    "outcome" JSONB,

    CONSTRAINT "AgentSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TechnicianSchedule" (
    "id" TEXT NOT NULL,
    "scheduleCode" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "technicianId" TEXT NOT NULL,
    "region" TEXT,
    "status" "ScheduleStatus" NOT NULL DEFAULT 'PLANNED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TechnicianSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleStop" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "sequenceNumber" INTEGER NOT NULL,
    "plannedEta" TIMESTAMP(3),
    "actualArrival" TIMESTAMP(3),
    "status" "StopStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,

    CONSTRAINT "ScheduleStop_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AgentSession_userId_idx" ON "AgentSession"("userId");

-- CreateIndex
CREATE INDEX "AgentSession_status_idx" ON "AgentSession"("status");

-- CreateIndex
CREATE INDEX "AgentSession_startedAt_idx" ON "AgentSession"("startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "TechnicianSchedule_scheduleCode_key" ON "TechnicianSchedule"("scheduleCode");

-- CreateIndex
CREATE INDEX "TechnicianSchedule_technicianId_idx" ON "TechnicianSchedule"("technicianId");

-- CreateIndex
CREATE INDEX "TechnicianSchedule_date_idx" ON "TechnicianSchedule"("date");

-- CreateIndex
CREATE INDEX "ScheduleStop_scheduleId_idx" ON "ScheduleStop"("scheduleId");

-- CreateIndex
CREATE INDEX "ScheduleStop_workOrderId_idx" ON "ScheduleStop"("workOrderId");

-- AddForeignKey
ALTER TABLE "AgentSession" ADD CONSTRAINT "AgentSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentSession" ADD CONSTRAINT "AgentSession_linkedWorkOrderId_fkey" FOREIGN KEY ("linkedWorkOrderId") REFERENCES "WorkOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechnicianSchedule" ADD CONSTRAINT "TechnicianSchedule_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleStop" ADD CONSTRAINT "ScheduleStop_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "TechnicianSchedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleStop" ADD CONSTRAINT "ScheduleStop_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
