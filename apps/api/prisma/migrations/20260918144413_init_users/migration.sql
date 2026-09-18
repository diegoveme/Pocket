-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('startup', 'specialist', 'manager');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('not_submitted', 'pending', 'approved', 'rejected');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "stellar_address" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "verification_status" "VerificationStatus" NOT NULL DEFAULT 'not_submitted',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_stellar_address_key" ON "users"("stellar_address");
