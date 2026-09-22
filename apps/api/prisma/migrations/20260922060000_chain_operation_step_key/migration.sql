-- AlterTable
ALTER TABLE "chain_operations" ADD COLUMN     "step_key" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "chain_operations_step_key_key" ON "chain_operations"("step_key");

