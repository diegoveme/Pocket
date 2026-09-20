-- CreateEnum
CREATE TYPE "StartupStage" AS ENUM ('idea', 'pre_seed', 'seed', 'series_a', 'series_b_plus');

-- CreateEnum
CREATE TYPE "ServiceCategory" AS ENUM ('growth', 'sales', 'marketing', 'digital_marketing');

-- CreateTable
CREATE TABLE "startup_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "company_name" TEXT NOT NULL,
    "one_liner" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "stage" "StartupStage" NOT NULL,
    "looking_for" TEXT NOT NULL,
    "website_url" TEXT,
    "logo_url" TEXT,
    "location" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "startup_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "startup_profiles_user_id_key" ON "startup_profiles"("user_id");

-- AddForeignKey
ALTER TABLE "startup_profiles" ADD CONSTRAINT "startup_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
