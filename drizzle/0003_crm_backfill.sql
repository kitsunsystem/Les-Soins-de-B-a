-- Crée les fiches clients à partir des rendez-vous existants (par email, puis par téléphone).
INSERT INTO `clients` (`id`, `name`, `email`, `phone`, `phone_key`, `birthdate`, `notes`, `created_at`, `updated_at`)
SELECT lower(hex(randomblob(16))), max(`client_name`), lower(trim(`client_email`)), max(`client_phone`), '', '', '', min(`created_at`), max(`updated_at`)
FROM `appointments`
WHERE trim(`client_email`) <> '' AND `service_id` <> 'blocage'
GROUP BY lower(trim(`client_email`));
--> statement-breakpoint
UPDATE `appointments`
SET `client_id` = (SELECT c.`id` FROM `clients` c WHERE c.`email` = lower(trim(`appointments`.`client_email`)))
WHERE trim(`client_email`) <> '' AND `service_id` <> 'blocage' AND `client_id` IS NULL;
--> statement-breakpoint
INSERT INTO `clients` (`id`, `name`, `email`, `phone`, `phone_key`, `birthdate`, `notes`, `created_at`, `updated_at`)
SELECT lower(hex(randomblob(16))), max(`client_name`), '', max(`client_phone`), replace(replace(replace(replace(`client_phone`, ' ', ''), '.', ''), '-', ''), '+', ''), '', '', min(`created_at`), max(`updated_at`)
FROM `appointments`
WHERE `client_id` IS NULL AND trim(`client_phone`) <> '' AND `service_id` <> 'blocage'
GROUP BY replace(replace(replace(replace(`client_phone`, ' ', ''), '.', ''), '-', ''), '+', '');
--> statement-breakpoint
UPDATE `appointments`
SET `client_id` = (SELECT c.`id` FROM `clients` c WHERE c.`email` = '' AND c.`phone_key` = replace(replace(replace(replace(`appointments`.`client_phone`, ' ', ''), '.', ''), '-', ''), '+', ''))
WHERE `client_id` IS NULL AND trim(`client_phone`) <> '' AND `service_id` <> 'blocage';
--> statement-breakpoint
UPDATE `clients`
SET `phone_key` = CASE
  WHEN replace(replace(replace(replace(`phone`, ' ', ''), '.', ''), '-', ''), '+', '') LIKE '33%'
    THEN '0' || substr(replace(replace(replace(replace(`phone`, ' ', ''), '.', ''), '-', ''), '+', ''), 3)
  ELSE replace(replace(replace(replace(`phone`, ' ', ''), '.', ''), '-', ''), '+', '')
END;
