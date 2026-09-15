-- Perbaikan drift: DB produksi dibuat dari skema lama via db:push sehingga
-- kolom/tabel/index dari migrasi 0000-0001 tidak pernah terbentuk.
-- Idempotent, aman dijalankan ulang.

BEGIN;

-- === users: kolom timestamp + unique nim yang hilang ===
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;
DO $$ BEGIN
  ALTER TABLE "users" ADD CONSTRAINT "users_nim_unique" UNIQUE("nim");
EXCEPTION WHEN duplicate_table OR duplicate_object THEN NULL; END $$;

-- === schedules ===
ALTER TABLE "schedules" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;
ALTER TABLE "schedules" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

-- === assessments ===
ALTER TABLE "assessments" ADD COLUMN IF NOT EXISTS "passing_score" integer DEFAULT 70 NOT NULL;
ALTER TABLE "assessments" ADD COLUMN IF NOT EXISTS "outcome_overridden" boolean DEFAULT false NOT NULL;
ALTER TABLE "assessments" ADD COLUMN IF NOT EXISTS "override_reason" text;
ALTER TABLE "assessments" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

-- === payments ===
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "academic_year" text DEFAULT '2025/2026' NOT NULL;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "billing_key" text DEFAULT 'certificate' NOT NULL;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "method" text;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

-- === audit_events: tabel yang belum pernah dibuat ===
CREATE TABLE IF NOT EXISTS "audit_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" varchar,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" varchar,
	"details" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
DO $$ BEGIN
  ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actor_id_users_id_fk"
    FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- === index yang hilang ===
CREATE UNIQUE INDEX IF NOT EXISTS "assessments_schedule_unique" ON "assessments" USING btree ("schedule_id");
CREATE INDEX IF NOT EXISTS "assessments_student_assessed_idx" ON "assessments" USING btree ("student_id","assessed_at");
CREATE INDEX IF NOT EXISTS "assessments_instructor_assessed_idx" ON "assessments" USING btree ("instructor_id","assessed_at");
CREATE INDEX IF NOT EXISTS "audit_events_entity_idx" ON "audit_events" USING btree ("entity_type","entity_id");
CREATE INDEX IF NOT EXISTS "audit_events_actor_created_idx" ON "audit_events" USING btree ("actor_id","created_at");
CREATE UNIQUE INDEX IF NOT EXISTS "payments_student_billing_unique" ON "payments" USING btree ("student_id","academic_year","billing_key");
CREATE INDEX IF NOT EXISTS "payments_student_status_idx" ON "payments" USING btree ("student_id","status");
CREATE INDEX IF NOT EXISTS "schedules_instructor_date_idx" ON "schedules" USING btree ("instructor_id","date");
CREATE INDEX IF NOT EXISTS "schedules_student_date_idx" ON "schedules" USING btree ("student_id","date");

COMMIT;
