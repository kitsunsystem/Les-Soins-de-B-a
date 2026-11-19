-- Réglages par défaut et horaires de départ (modifiables ensuite dans l'espace admin).
INSERT OR IGNORE INTO `settings` (`id`) VALUES (1);
--> statement-breakpoint
INSERT INTO `weekly_hours` (`weekday`, `start`, `end`) VALUES
  (1, '09:00', '12:30'), (1, '14:00', '19:00'),
  (2, '09:00', '12:30'), (2, '14:00', '19:00'),
  (3, '09:00', '12:30'), (3, '14:00', '19:00'),
  (4, '09:00', '12:30'), (4, '14:00', '19:00'),
  (5, '09:00', '12:30'), (5, '14:00', '19:00'),
  (6, '09:00', '13:00');
