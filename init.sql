-- Script exécuté automatiquement au premier démarrage du conteneur MySQL
-- Les tables sont créées par Hibernate (ddl-auto: update), ce script
-- sert uniquement à configurer le charset et les droits.

ALTER DATABASE hackaton_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Accorder tous les droits à l'utilisateur applicatif
GRANT ALL PRIVILEGES ON hackaton_db.* TO 'educonnect'@'%';
FLUSH PRIVILEGES;
