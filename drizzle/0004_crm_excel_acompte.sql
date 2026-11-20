CREATE TABLE `admissions` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`data` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `admissions_client_idx` ON `admissions` (`client_id`);--> statement-breakpoint
CREATE TABLE `session_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`appointment_id` text,
	`date` text NOT NULL,
	`prestation` text DEFAULT '' NOT NULL,
	`duration_minutes` integer,
	`motive` text DEFAULT '' NOT NULL,
	`change_reported` integer DEFAULT false NOT NULL,
	`observations` text DEFAULT '' NOT NULL,
	`feeling` text DEFAULT '' NOT NULL,
	`advice` text DEFAULT '' NOT NULL,
	`next_session` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `session_notes_client_idx` ON `session_notes` (`client_id`);--> statement-breakpoint
CREATE INDEX `session_notes_appointment_idx` ON `session_notes` (`appointment_id`);--> statement-breakpoint
ALTER TABLE `appointments` ADD `mode` text DEFAULT 'cabinet' NOT NULL;--> statement-breakpoint
ALTER TABLE `appointments` ADD `cancelled_by` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `appointments` ADD `deposit_cents` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `appointments` ADD `deposit_status` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `appointments` ADD `payment_ref` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `appointments` ADD `hold_expires_at` integer;--> statement-breakpoint
ALTER TABLE `clients` ADD `first_name` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `clients` ADD `last_name` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `clients` ADD `address` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `clients` ADD `profession` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `clients` ADD `how_found` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `clients` ADD `motive` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `clients` ADD `vigilance` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `clients` ADD `first_visit` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `clients` ADD `admission_received_at` integer;--> statement-breakpoint
ALTER TABLE `clients` ADD `consent_at` integer;--> statement-breakpoint
ALTER TABLE `clients` ADD `admission_token` text;--> statement-breakpoint
ALTER TABLE `clients` ADD `deposit_policy` text DEFAULT 'auto' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `clients_admission_token_unique` ON `clients` (`admission_token`);--> statement-breakpoint
ALTER TABLE `settings` ADD `deposit_enabled` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `settings` ADD `deposit_amount` integer DEFAULT 20 NOT NULL;--> statement-breakpoint
ALTER TABLE `settings` ADD `deposit_threshold` integer DEFAULT 2 NOT NULL;