-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('awaiting_specialist', 'awaiting_funding', 'active', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "MilestoneStatus" AS ENUM ('pending', 'delivered', 'changes_requested', 'approved', 'paid', 'disputed', 'resolved');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('open', 'resolved');

-- CreateEnum
CREATE TYPE "DisputeOutcome" AS ENUM ('pay_specialist', 'refund_startup', 'split');

-- CreateEnum
CREATE TYPE "ChainOperationKind" AS ENUM ('trustline', 'deploy', 'fund', 'approve', 'release', 'dispute', 'resolve');

-- CreateEnum
CREATE TYPE "ChainOperationStatus" AS ENUM ('prepared', 'confirmed', 'failed');

-- CreateTable
CREATE TABLE "contracts" (
    "id" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "startup_id" UUID NOT NULL,
    "specialist_id" UUID NOT NULL,
    "amount" DECIMAL(20,7) NOT NULL,
    "status" "ContractStatus" NOT NULL DEFAULT 'awaiting_specialist',
    "escrow_id" TEXT,
    "accepted_at" TIMESTAMP(3),
    "funded_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "milestones" (
    "id" UUID NOT NULL,
    "contract_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(20,7) NOT NULL,
    "due_date" DATE NOT NULL,
    "status" "MilestoneStatus" NOT NULL DEFAULT 'pending',
    "approved_at" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deliverables" (
    "id" UUID NOT NULL,
    "milestone_id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "note" TEXT,
    "feedback" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deliverables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disputes" (
    "id" UUID NOT NULL,
    "milestone_id" UUID NOT NULL,
    "opened_by" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "DisputeStatus" NOT NULL DEFAULT 'open',
    "outcome" "DisputeOutcome",
    "specialist_amount" DECIMAL(20,7),
    "startup_amount" DECIMAL(20,7),
    "resolution_note" TEXT,
    "resolved_by" UUID,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispute_evidence" (
    "id" UUID NOT NULL,
    "dispute_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "url" TEXT,
    "comment" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dispute_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chain_operations" (
    "id" UUID NOT NULL,
    "kind" "ChainOperationKind" NOT NULL,
    "status" "ChainOperationStatus" NOT NULL DEFAULT 'prepared',
    "tx_hash" TEXT NOT NULL,
    "signer_id" UUID,
    "contract_id" UUID,
    "milestone_id" UUID,
    "amount" DECIMAL(20,7),
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmed_at" TIMESTAMP(3),

    CONSTRAINT "chain_operations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "contracts_application_id_key" ON "contracts"("application_id");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_escrow_id_key" ON "contracts"("escrow_id");

-- CreateIndex
CREATE INDEX "contracts_job_id_idx" ON "contracts"("job_id");

-- CreateIndex
CREATE INDEX "contracts_startup_id_idx" ON "contracts"("startup_id");

-- CreateIndex
CREATE INDEX "contracts_specialist_id_idx" ON "contracts"("specialist_id");

-- CreateIndex
CREATE UNIQUE INDEX "milestones_contract_id_position_key" ON "milestones"("contract_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "deliverables_milestone_id_version_key" ON "deliverables"("milestone_id", "version");

-- CreateIndex
CREATE INDEX "disputes_milestone_id_idx" ON "disputes"("milestone_id");

-- CreateIndex
CREATE INDEX "disputes_status_idx" ON "disputes"("status");

-- CreateIndex
CREATE INDEX "dispute_evidence_dispute_id_idx" ON "dispute_evidence"("dispute_id");

-- CreateIndex
CREATE UNIQUE INDEX "chain_operations_tx_hash_key" ON "chain_operations"("tx_hash");

-- CreateIndex
CREATE INDEX "chain_operations_contract_id_idx" ON "chain_operations"("contract_id");

-- CreateIndex
CREATE INDEX "chain_operations_milestone_id_idx" ON "chain_operations"("milestone_id");

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_startup_id_fkey" FOREIGN KEY ("startup_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_specialist_id_fkey" FOREIGN KEY ("specialist_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliverables" ADD CONSTRAINT "deliverables_milestone_id_fkey" FOREIGN KEY ("milestone_id") REFERENCES "milestones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_milestone_id_fkey" FOREIGN KEY ("milestone_id") REFERENCES "milestones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_opened_by_fkey" FOREIGN KEY ("opened_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_evidence" ADD CONSTRAINT "dispute_evidence_dispute_id_fkey" FOREIGN KEY ("dispute_id") REFERENCES "disputes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_evidence" ADD CONSTRAINT "dispute_evidence_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chain_operations" ADD CONSTRAINT "chain_operations_signer_id_fkey" FOREIGN KEY ("signer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chain_operations" ADD CONSTRAINT "chain_operations_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chain_operations" ADD CONSTRAINT "chain_operations_milestone_id_fkey" FOREIGN KEY ("milestone_id") REFERENCES "milestones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

