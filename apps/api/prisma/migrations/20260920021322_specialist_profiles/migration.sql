-- CreateTable
CREATE TABLE "specialist_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "display_name" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "categories" "ServiceCategory"[],
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "case_studies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "hourly_rate" DECIMAL(20,7),
    "min_project_budget" DECIMAL(20,7),
    "portfolio_url" TEXT,
    "linkedin_url" TEXT,
    "avatar_url" TEXT,
    "location" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "specialist_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "specialist_profiles_user_id_key" ON "specialist_profiles"("user_id");

-- CreateIndex
CREATE INDEX "specialist_profiles_categories_idx" ON "specialist_profiles"("categories");

-- AddForeignKey
ALTER TABLE "specialist_profiles" ADD CONSTRAINT "specialist_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
