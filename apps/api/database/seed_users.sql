USE `lyceum`;

DELETE FROM `users` WHERE `email` IN (
  'admin@lyceum.dz',
  'president@lyceum.dz',
  'hr@lyceum.dz',
  'member@lyceum.dz'
);

INSERT INTO `users` (`full_name`, `email`, `password_hash`, `role`, `is_active`)
VALUES
('Club Administrator', 'admin@lyceum.dz', '$2b$10$6/gxIHhY0J/mqUNelhclwuZuLNDJYmyOu0zRsYIbbjjXZswfUguuG', 'admin', 1),
('Club President', 'president@lyceum.dz', '$2b$10$LDQmgYE0nPo6e2ccMlHaeeo0gNs0iKeMmPiSXptBHRD.JyOrwFNjC', 'president', 1),
('HR Responsible', 'hr@lyceum.dz', '$2b$10$8o7LCeTnWTqhZtwS6doDm.N7c9sw46qYqD1anBTIbEW1colzPwyTq', 'hr', 1),
('Club Member', 'member@lyceum.dz', '$2b$10$Ro7LgLO21Kjfm7UKaz42qehGuHB/Fux0QOEI9zBXqpl4pPZDQJFky', 'member', 1);
