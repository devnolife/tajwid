CREATE TYPE "public"."notification_type" AS ENUM('info', 'payment', 'schedule', 'result', 'certificate', 'system');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('belum_bayar', 'menunggu_verifikasi', 'lunas', 'ditolak');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('mahasiswa', 'instruktur', 'admin');--> statement-breakpoint
CREATE TYPE "public"."schedule_status" AS ENUM('scheduled', 'completed', 'no_show', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."test_status" AS ENUM('belum_tes', 'sudah_tes', 'lulus', 'tidak_lulus');--> statement-breakpoint
CREATE TABLE "assessments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" varchar NOT NULL,
	"instructor_id" varchar NOT NULL,
	"schedule_id" varchar,
	"tajwid" integer DEFAULT 0 NOT NULL,
	"kelancaran" integer DEFAULT 0 NOT NULL,
	"makhorijul_huruf" integer DEFAULT 0 NOT NULL,
	"adab" integer DEFAULT 0 NOT NULL,
	"total_score" integer DEFAULT 0 NOT NULL,
	"passing_score" integer DEFAULT 70 NOT NULL,
	"passed" boolean DEFAULT false NOT NULL,
	"outcome_overridden" boolean DEFAULT false NOT NULL,
	"override_reason" text,
	"notes" text,
	"assessed_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" varchar,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" varchar,
	"details" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "certificates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"certificate_number" text NOT NULL,
	"student_id" varchar NOT NULL,
	"assessment_id" varchar NOT NULL,
	"student_name" text NOT NULL,
	"student_nim" text,
	"student_faculty" text,
	"student_program" text,
	"total_score" integer NOT NULL,
	"academic_year" text DEFAULT '2025/2026' NOT NULL,
	"signer_name" text DEFAULT 'Dr. Alamsyah, S.Pd.I., M.H.' NOT NULL,
	"signer_title" text DEFAULT 'Wakil Dekan IV' NOT NULL,
	"issued_at" timestamp DEFAULT now(),
	CONSTRAINT "certificates_certificate_number_unique" UNIQUE("certificate_number"),
	CONSTRAINT "certificates_student_id_unique" UNIQUE("student_id")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"type" "notification_type" DEFAULT 'info' NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"link" text,
	"read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" varchar NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"due_date" timestamp NOT NULL,
	"description" text,
	"academic_year" text DEFAULT '2025/2026' NOT NULL,
	"billing_key" text DEFAULT 'certificate' NOT NULL,
	"status" "payment_status" DEFAULT 'belum_bayar' NOT NULL,
	"proof_url" text,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "schedules" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" varchar NOT NULL,
	"instructor_id" varchar NOT NULL,
	"date" timestamp NOT NULL,
	"room" text NOT NULL,
	"location" text,
	"status" "schedule_status" DEFAULT 'scheduled' NOT NULL,
	"is_repeat" boolean DEFAULT false NOT NULL,
	"parent_schedule_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"app_name" text DEFAULT 'TajwidKu' NOT NULL,
	"academic_year" text DEFAULT '2025/2026' NOT NULL,
	"passing_score" integer DEFAULT 70 NOT NULL,
	"payment_amount" numeric(12, 2) DEFAULT '25000' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"role" "role" DEFAULT 'mahasiswa' NOT NULL,
	"name" text NOT NULL,
	"nim" text,
	"faculty" text,
	"program" text,
	"email" text,
	"phone" text,
	"specialization" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_nim_unique" UNIQUE("nim")
);
--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_instructor_id_users_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_schedule_id_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."schedules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_assessment_id_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_instructor_id_users_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_parent_schedule_fk" FOREIGN KEY ("parent_schedule_id") REFERENCES "public"."schedules"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "assessments_schedule_unique" ON "assessments" USING btree ("schedule_id");--> statement-breakpoint
CREATE INDEX "assessments_student_assessed_idx" ON "assessments" USING btree ("student_id","assessed_at");--> statement-breakpoint
CREATE INDEX "assessments_instructor_assessed_idx" ON "assessments" USING btree ("instructor_id","assessed_at");--> statement-breakpoint
CREATE INDEX "audit_events_entity_idx" ON "audit_events" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_events_actor_created_idx" ON "audit_events" USING btree ("actor_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_student_billing_unique" ON "payments" USING btree ("student_id","academic_year","billing_key");--> statement-breakpoint
CREATE INDEX "payments_student_status_idx" ON "payments" USING btree ("student_id","status");--> statement-breakpoint
CREATE INDEX "schedules_instructor_date_idx" ON "schedules" USING btree ("instructor_id","date");--> statement-breakpoint
CREATE INDEX "schedules_student_date_idx" ON "schedules" USING btree ("student_id","date");