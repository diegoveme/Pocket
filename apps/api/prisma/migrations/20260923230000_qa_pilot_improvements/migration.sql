-- Startup profile: who signs and in which languages the company works.
ALTER TABLE "startup_profiles" ADD COLUMN     "contact_role" TEXT,
ADD COLUMN     "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "legal_name" TEXT;

-- Specialist profile: tools, seniority, languages and availability.
ALTER TABLE "specialist_profiles" ADD COLUMN     "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "timezone" TEXT,
ADD COLUMN     "tools" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "weekly_hours" INTEGER,
ADD COLUMN     "years_experience" INTEGER;

-- Past work becomes a link plus its result. Existing links are kept, with an
-- empty result for their owner to fill in.
ALTER TABLE "specialist_profiles" ADD COLUMN "case_studies_json" JSONB NOT NULL DEFAULT '[]';
UPDATE "specialist_profiles"
SET "case_studies_json" = COALESCE(
  (SELECT jsonb_agg(jsonb_build_object('url', link, 'result', ''))
   FROM unnest("case_studies") AS link),
  '[]'::jsonb
);
ALTER TABLE "specialist_profiles" DROP COLUMN "case_studies";
ALTER TABLE "specialist_profiles" RENAME COLUMN "case_studies_json" TO "case_studies";

-- Job: what the specialist needs to know before applying.
ALTER TABLE "jobs" ADD COLUMN     "channel" TEXT,
ADD COLUMN     "content_language" TEXT,
ADD COLUMN     "revision_rounds" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "startup_provides" TEXT;

-- Application: a guided proposal. The old free text becomes the approach.
ALTER TABLE "applications" ADD COLUMN "approach" TEXT,
ADD COLUMN     "needs_from_startup" TEXT,
ADD COLUMN     "similar_work_url" TEXT;
UPDATE "applications" SET "approach" = "proposal";
ALTER TABLE "applications" ALTER COLUMN "approach" SET NOT NULL;
ALTER TABLE "applications" DROP COLUMN "proposal";

-- Milestones carry what they have to meet and how many rounds were used.
ALTER TABLE "milestones" ADD COLUMN     "acceptance_criteria" TEXT,
ADD COLUMN     "revisions_used" INTEGER NOT NULL DEFAULT 0;

-- The payment plan the startup posts with the job.
CREATE TABLE "job_milestones" (
    "id" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "acceptance_criteria" TEXT NOT NULL,
    "amount" DECIMAL(20,7) NOT NULL,
    "due_date" DATE NOT NULL,

    CONSTRAINT "job_milestones_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "job_milestones_job_id_position_key" ON "job_milestones"("job_id", "position");

ALTER TABLE "job_milestones" ADD CONSTRAINT "job_milestones_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
