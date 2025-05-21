-- Insertar roles
INSERT IGNORE INTO roles (nombre) VALUES 
('administrador'),
('colaborador'),
('usuario');

-- Insertar usuario administrador
-- Nota: La contraseña es 'w35115415' hasheada con bcrypt
INSERT IGNORE INTO users (nombre, email, password, role_id)
VALUES (
  'Matias Moreira',
  'matias4315@gmail.com',
  '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  (SELECT id FROM roles WHERE nombre = 'administrador')
); 