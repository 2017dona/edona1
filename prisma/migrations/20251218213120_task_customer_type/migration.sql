-- AlterTable
ALTER TABLE "Task" ADD COLUMN "customer" TEXT;
ALTER TABLE "Task" ADD COLUMN "taskType" TEXT;

-- CreateIndex
CREATE INDEX "Task_customer_idx" ON "Task"("customer");

-- CreateIndex
CREATE INDEX "Task_taskType_idx" ON "Task"("taskType");
