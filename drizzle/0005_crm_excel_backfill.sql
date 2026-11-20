-- Annulations faites en ligne par les clientes (comptées pour l'acompte).
UPDATE `appointments` SET `cancelled_by` = 'client' WHERE `status` = 'cancelled' AND `admin_note` = 'Annulé par le client en ligne';
--> statement-breakpoint
UPDATE `appointments` SET `cancelled_by` = 'admin' WHERE `status` = 'cancelled' AND `cancelled_by` = '';
--> statement-breakpoint
-- Lien personnel vers la fiche d'admission pour chaque fiche existante.
UPDATE `clients` SET `admission_token` = lower(hex(randomblob(18))) WHERE `admission_token` IS NULL;
