-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('open', 'in_progress', 'completed', 'closed');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('submitted', 'accepted', 'rejected', 'withdrawn');

-- CreateTable
CREATE TABLE "jobs" (
    "id" UUID NOT NULL,
    "startup_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "ServiceCategory" NOT NULL,
    "deliverables" TEXT NOT NULL,
    "budget" DECIMAL(20,7) NOT NULL,
    "deadline" DATE NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "specialist_id" UUID NOT NULL,
    "proposal" TEXT NOT NULL,
    "price" DECIMAL(20,7) NOT NULL,
    "estimated_days" INTEGER NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'submitted',
    "decided_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "jobs_status_category_idx" ON "jobs"("status", "category");

-- CreateIndex
CREATE INDEX "jobs_startup_id_idx" ON "jobs"("startup_id");

-- CreateIndex
CREATE INDEX "applications_specialist_id_idx" ON "applications"("specialist_id");

-- CreateIndex
CREATE UNIQUE INDEX "applications_job_id_specialist_id_key" ON "applications"("job_id", "specialist_id");

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_startup_id_fkey" FOREIGN KEY ("startup_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_specialist_id_fkey" FOREIGN KEY ("specialist_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

