CREATE TABLE "appointments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_id" text NOT NULL,
	"service_name" text NOT NULL,
	"duration_minutes" integer NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"client_name" text NOT NULL,
	"client_email" text DEFAULT '' NOT NULL,
	"client_phone" text DEFAULT '' NOT NULL,
	"message" text DEFAULT '' NOT NULL,
	"source" text DEFAULT 'online' NOT NULL,
	"cancel_token" text NOT NULL,
	"admin_note" text DEFAULT '' NOT NULL,
	"reminder_sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "appointments_cancel_token_unique" UNIQUE("cancel_token")
);
--> statement-breakpoint
CREATE TABLE "date_overrides" (
	"date" text PRIMARY KEY NOT NULL,
	"closed" boolean DEFAULT false NOT NULL,
	"ranges" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"note" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"slot_step_minutes" integer DEFAULT 30 NOT NULL,
	"buffer_minutes" integer DEFAULT 15 NOT NULL,
	"min_notice_hours" integer DEFAULT 24 NOT NULL,
	"max_days_ahead" integer DEFAULT 60 NOT NULL,
	"auto_confirm" boolean DEFAULT false NOT NULL,
	"booking_enabled" boolean DEFAULT true NOT NULL,
	"booking_notice" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "weekly_hours" (
	"id" serial PRIMARY KEY NOT NULL,
	"weekday" integer NOT NULL,
	"start" text NOT NULL,
	"end" text NOT NULL
);
--> statement-breakpoint
CREATE INDEX "appointments_starts_at_idx" ON "appointments" USING btree ("starts_at");--> statement-breakpoint
CREATE INDEX "appointments_status_idx" ON "appointments" USING btree ("status");