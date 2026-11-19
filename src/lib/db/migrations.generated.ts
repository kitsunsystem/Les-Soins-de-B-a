// Fichier généré par scripts/bundle-migrations.mjs — ne pas modifier à la main.
export const migrations: { name: string; statements: string[] }[] = [
  {
    "name": "0000_init.sql",
    "statements": [
      "CREATE TABLE `appointments` (\n\t`id` text PRIMARY KEY NOT NULL,\n\t`service_id` text NOT NULL,\n\t`service_name` text NOT NULL,\n\t`duration_minutes` integer NOT NULL,\n\t`starts_at` integer NOT NULL,\n\t`ends_at` integer NOT NULL,\n\t`status` text DEFAULT 'pending' NOT NULL,\n\t`client_name` text NOT NULL,\n\t`client_email` text DEFAULT '' NOT NULL,\n\t`client_phone` text DEFAULT '' NOT NULL,\n\t`message` text DEFAULT '' NOT NULL,\n\t`source` text DEFAULT 'online' NOT NULL,\n\t`cancel_token` text NOT NULL,\n\t`admin_note` text DEFAULT '' NOT NULL,\n\t`reminder_sent_at` integer,\n\t`created_at` integer NOT NULL,\n\t`updated_at` integer NOT NULL\n);",
      "CREATE UNIQUE INDEX `appointments_cancel_token_unique` ON `appointments` (`cancel_token`);",
      "CREATE INDEX `appointments_starts_at_idx` ON `appointments` (`starts_at`);",
      "CREATE INDEX `appointments_status_idx` ON `appointments` (`status`);",
      "CREATE TABLE `date_overrides` (\n\t`date` text PRIMARY KEY NOT NULL,\n\t`closed` integer DEFAULT false NOT NULL,\n\t`ranges` text DEFAULT '[]' NOT NULL,\n\t`note` text DEFAULT '' NOT NULL\n);",
      "CREATE TABLE `settings` (\n\t`id` integer PRIMARY KEY DEFAULT 1 NOT NULL,\n\t`slot_step_minutes` integer DEFAULT 30 NOT NULL,\n\t`buffer_minutes` integer DEFAULT 15 NOT NULL,\n\t`min_notice_hours` integer DEFAULT 24 NOT NULL,\n\t`max_days_ahead` integer DEFAULT 60 NOT NULL,\n\t`auto_confirm` integer DEFAULT false NOT NULL,\n\t`booking_enabled` integer DEFAULT true NOT NULL,\n\t`booking_notice` text DEFAULT '' NOT NULL\n);",
      "CREATE TABLE `weekly_hours` (\n\t`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,\n\t`weekday` integer NOT NULL,\n\t`start` text NOT NULL,\n\t`end` text NOT NULL\n);"
    ]
  },
  {
    "name": "0001_seed.sql",
    "statements": [
      "INSERT OR IGNORE INTO `settings` (`id`) VALUES (1);",
      "INSERT INTO `weekly_hours` (`weekday`, `start`, `end`) VALUES\n  (1, '09:00', '12:30'), (1, '14:00', '19:00'),\n  (2, '09:00', '12:30'), (2, '14:00', '19:00'),\n  (3, '09:00', '12:30'), (3, '14:00', '19:00'),\n  (4, '09:00', '12:30'), (4, '14:00', '19:00'),\n  (5, '09:00', '12:30'), (5, '14:00', '19:00'),\n  (6, '09:00', '13:00');"
    ]
  },
  {
    "name": "0002_crm.sql",
    "statements": [
      "CREATE TABLE `clients` (\n\t`id` text PRIMARY KEY NOT NULL,\n\t`name` text NOT NULL,\n\t`email` text DEFAULT '' NOT NULL,\n\t`phone` text DEFAULT '' NOT NULL,\n\t`phone_key` text DEFAULT '' NOT NULL,\n\t`birthdate` text DEFAULT '' NOT NULL,\n\t`notes` text DEFAULT '' NOT NULL,\n\t`created_at` integer NOT NULL,\n\t`updated_at` integer NOT NULL\n);",
      "CREATE INDEX `clients_email_idx` ON `clients` (`email`);",
      "CREATE INDEX `clients_phone_key_idx` ON `clients` (`phone_key`);",
      "CREATE TABLE `contact_messages` (\n\t`id` text PRIMARY KEY NOT NULL,\n\t`client_id` text,\n\t`name` text NOT NULL,\n\t`email` text NOT NULL,\n\t`phone` text DEFAULT '' NOT NULL,\n\t`subject` text NOT NULL,\n\t`message` text NOT NULL,\n\t`created_at` integer NOT NULL\n);",
      "CREATE INDEX `contact_messages_client_idx` ON `contact_messages` (`client_id`);",
      "ALTER TABLE `appointments` ADD `client_id` text;",
      "CREATE INDEX `appointments_client_idx` ON `appointments` (`client_id`);"
    ]
  },
  {
    "name": "0003_crm_backfill.sql",
    "statements": [
      "INSERT INTO `clients` (`id`, `name`, `email`, `phone`, `phone_key`, `birthdate`, `notes`, `created_at`, `updated_at`)\nSELECT lower(hex(randomblob(16))), max(`client_name`), lower(trim(`client_email`)), max(`client_phone`), '', '', '', min(`created_at`), max(`updated_at`)\nFROM `appointments`\nWHERE trim(`client_email`) <> '' AND `service_id` <> 'blocage'\nGROUP BY lower(trim(`client_email`));",
      "UPDATE `appointments`\nSET `client_id` = (SELECT c.`id` FROM `clients` c WHERE c.`email` = lower(trim(`appointments`.`client_email`)))\nWHERE trim(`client_email`) <> '' AND `service_id` <> 'blocage' AND `client_id` IS NULL;",
      "INSERT INTO `clients` (`id`, `name`, `email`, `phone`, `phone_key`, `birthdate`, `notes`, `created_at`, `updated_at`)\nSELECT lower(hex(randomblob(16))), max(`client_name`), '', max(`client_phone`), replace(replace(replace(replace(`client_phone`, ' ', ''), '.', ''), '-', ''), '+', ''), '', '', min(`created_at`), max(`updated_at`)\nFROM `appointments`\nWHERE `client_id` IS NULL AND trim(`client_phone`) <> '' AND `service_id` <> 'blocage'\nGROUP BY replace(replace(replace(replace(`client_phone`, ' ', ''), '.', ''), '-', ''), '+', '');",
      "UPDATE `appointments`\nSET `client_id` = (SELECT c.`id` FROM `clients` c WHERE c.`email` = '' AND c.`phone_key` = replace(replace(replace(replace(`appointments`.`client_phone`, ' ', ''), '.', ''), '-', ''), '+', ''))\nWHERE `client_id` IS NULL AND trim(`client_phone`) <> '' AND `service_id` <> 'blocage';",
      "UPDATE `clients`\nSET `phone_key` = CASE\n  WHEN replace(replace(replace(replace(`phone`, ' ', ''), '.', ''), '-', ''), '+', '') LIKE '33%'\n    THEN '0' || substr(replace(replace(replace(replace(`phone`, ' ', ''), '.', ''), '-', ''), '+', ''), 3)\n  ELSE replace(replace(replace(replace(`phone`, ' ', ''), '.', ''), '-', ''), '+', '')\nEND;"
    ]
  }
];
