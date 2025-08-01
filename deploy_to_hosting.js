const fs = require('fs');
const path = require('path');

console.log('🚀 Preparando archivos para subir al hosting...');

// Lista de archivos y directorios a incluir
const filesToInclude = [
  'src/',
  'public/',
  'package.json',
  'package-lock.json',
  'passenger_app.js',
  '.htaccess',
  'env.production.example'
];

// Crear directorio de deploy si no existe
const deployDir = 'deploy';
if (!fs.existsSync(deployDir)) {
  fs.mkdirSync(deployDir);
}

console.log('📁 Creando directorio de deploy...');

// Función para copiar archivos recursivamente
function copyRecursive(src, dest) {
  if (fs.statSync(src).isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    const files = fs.readdirSync(src);
    files.forEach(file => {
      copyRecursive(path.join(src, file), path.join(dest, file));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

// Copiar archivos
filesToInclude.forEach(file => {
  if (fs.existsSync(file)) {
    const destPath = path.join(deployDir, file);
    copyRecursive(file, destPath);
    console.log(`✅ Copiado: ${file}`);
  } else {
    console.log(`⚠️ No encontrado: ${file}`);
  }
});

// Crear archivo .env para producción
const envProduction = `# Configuración de producción para cPanel
# Copia este archivo como .env y configura los valores correctos

# Configuración del servidor
NODE_ENV=production
PORT=3001
HOST=0.0.0.0

# Configuración de CORS
CORS_ORIGIN=https://diario.trigamer.xyz,https://www.diario.trigamer.xyz,*

# Configuración de base de datos MySQL
# Obtén estos valores desde el panel de cPanel > Bases de datos MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=trigamer_diario
DB_PASSWORD=TU_CONTRASEÑA_AQUI
DB_NAME=trigamer_diario
DB_POOL_MAX=5

# Configuración de JWT
# Genera una clave secreta segura para producción
JWT_SECRET=clave_secreta_muy_segura_para_produccion_cambiar_esto
JWT_EXPIRES_IN=1d

# Configuración de DeepSeek AI (opcional)
DEEPSEEK_API_KEY=

# Configuración de RSS
RSS_FEED_URL=https://lapiramide.net/feed
RSS_ENABLED=true
RSS_INTERVAL_MINUTES=360

# Configuración de logs
LOG_LEVEL=info

# Configuración de memoria (para cPanel con recursos limitados)
NODE_OPTIONS=--max-old-space-size=512

# Configuración de timezone
TZ=America/Argentina/Buenos_Aires
`;

fs.writeFileSync(path.join(deployDir, 'env.production.example'), envProduction);
console.log('✅ Archivo env.production.example creado');

// Crear script SQL para la base de datos
const sqlScript = `-- Script para configurar la base de datos en producción
-- Ejecutar en phpMyAdmin o en la consola MySQL del hosting

-- Crear la base de datos si no existe
CREATE DATABASE IF NOT EXISTS trigamer_diario;

-- Usar la base de datos
USE trigamer_diario;

-- Crear tabla de roles
CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE
);

-- Insertar roles básicos
INSERT IGNORE INTO roles (nombre) VALUES 
('administrador'),
('colaborador'),
('usuario');

-- Crear tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role_id INT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- Agregar columna is_active si no existe
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Insertar usuario administrador (cambiar la contraseña)
INSERT IGNORE INTO users (nombre, email, password, role_id, is_active)
VALUES (
  'Matias Moreira',
  'matias4315@gmail.com',
  '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- Contraseña: w35115415
  (SELECT id FROM roles WHERE nombre = 'administrador'),
  TRUE
);

-- Insertar usuario de prueba
INSERT IGNORE INTO users (nombre, email, password, role_id, is_active)
VALUES (
  'Usuario Test',
  'test@test.com',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- Contraseña: 123456
  (SELECT id FROM roles WHERE nombre = 'usuario'),
  TRUE
);

-- Verificar usuarios creados
SELECT u.id, u.nombre, u.email, r.nombre as role, u.is_active
FROM users u
JOIN roles r ON u.role_id = r.id;
`;

fs.writeFileSync(path.join(deployDir, 'setup_database.sql'), sqlScript);
console.log('✅ Script SQL creado');

// Crear archivo de instrucciones
const instructions = `# 🚀 INSTRUCCIONES PARA SUBIR AL HOSTING

## 1. Subir archivos
1. Comprime la carpeta 'deploy' en un archivo ZIP
2. Sube el ZIP a tu hosting en cPanel
3. Extrae el archivo ZIP en el directorio de tu dominio

## 2. Configurar base de datos
1. Ve a cPanel > Bases de datos MySQL
2. Crea una nueva base de datos llamada 'trigamer_diario'
3. Crea un usuario MySQL con permisos en la base de datos
4. Ejecuta el script 'setup_database.sql' en phpMyAdmin

## 3. Configurar variables de entorno
1. Copia 'env.production.example' como '.env'
2. Edita el archivo .env con tus datos:
   - DB_USER: tu_usuario_mysql
   - DB_PASSWORD: tu_contraseña_mysql
   - JWT_SECRET: genera una clave secreta segura

## 4. Configurar aplicación Node.js
1. Ve a cPanel > Setup Node.js App
2. Configura la aplicación:
   - Startup File: passenger_app.js
   - Node.js Version: 18.x o superior
   - Environment Variables: copia las del archivo .env

## 5. Instalar dependencias
En la terminal de cPanel:
\`\`\`bash
cd /home/tu_usuario/diario.trigamer.xyz
npm install
npm install undici@5.28.4 --save
\`\`\`

## 6. Reiniciar aplicación
1. En cPanel > Setup Node.js App
2. Haz clic en "Restart" en tu aplicación

## 7. Verificar funcionamiento
- Visita: https://diario.trigamer.xyz
- Prueba login con: test@test.com / 123456

## 📋 Credenciales de prueba:
- Email: test@test.com
- Contraseña: 123456
- Admin: matias4315@gmail.com / w35115415

## 🔧 Si hay problemas:
1. Revisa los logs en cPanel > Error Logs
2. Verifica la conexión a la base de datos
3. Asegúrate que las variables de entorno estén configuradas
`;

fs.writeFileSync(path.join(deployDir, 'INSTRUCCIONES_DEPLOY.md'), instructions);
console.log('✅ Archivo de instrucciones creado');

console.log('\n🎉 Preparación completada!');
console.log('📁 Revisa la carpeta "deploy" para los archivos listos para subir');
console.log('📋 Sigue las instrucciones en INSTRUCCIONES_DEPLOY.md'); 