-- CreateTable
CREATE TABLE "verification_requests" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'pending',
    "full_name" TEXT NOT NULL,
    "contact_email" TEXT NOT NULL,
    "country" CHAR(2) NOT NULL,
    "linkedin_url" TEXT,
    "website_url" TEXT,
    "company_name" TEXT,
    "company_registration_id" TEXT,
    "note" TEXT,
    "review_note" TEXT,
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMP(3),
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "verification_requests_user_id_idx" ON "verification_requests"("user_id");

-- CreateIndex
CREATE INDEX "verification_requests_status_idx" ON "verification_requests"("status");

-- AddForeignKey
ALTER TABLE "verification_requests" ADD CONSTRAINT "verification_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_requests" ADD CONSTRAINT "verification_requests_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
