"use strict";

const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

async function normalizeRoles() {
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || process.env.MYSQL_DATABASE || 'trigamer_diario',
  };

  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado a la base de datos');

    // Detectar esquema: roles por nombre/role_id o columna users.rol
    const [columns] = await conn.query("SHOW COLUMNS FROM users");
    const hasRolColumn = columns.some(c => c.Field === 'rol');
    const hasRoleIdColumn = columns.some(c => c.Field === 'role_id');
    const hasRoleEnum = columns.some(c => c.Field === 'role');

    // Asegurar tabla roles con valores básicos si existe role_id
    if (hasRoleIdColumn) {
      await conn.execute("CREATE TABLE IF NOT EXISTS roles (id INT AUTO_INCREMENT PRIMARY KEY, nombre VARCHAR(50) NOT NULL UNIQUE)");
      await conn.execute("INSERT IGNORE INTO roles (nombre) VALUES ('administrador'), ('colaborador'), ('usuario')");
    }

    let updated = 0;

    if (hasRolColumn) {
      // Normalizar users.rol: si es NULL o vacío, poner 'usuario'
      const [res] = await conn.execute("UPDATE users SET rol = 'usuario' WHERE rol IS NULL OR TRIM(rol) = ''");
      updated += res.affectedRows || 0;
      console.log(`🛠️ Normalizados (users.rol vacío/null) -> usuario: ${res.affectedRows}`);
    }

    if (hasRoleEnum) {
      // Normalizar users.role (ENUM): si es NULL o vacío, poner 'usuario'
      const [res] = await conn.execute("UPDATE users SET role = 'usuario' WHERE role IS NULL OR TRIM(role) = ''");
      updated += res.affectedRows || 0;
      console.log(`🛠️ Normalizados (users.role vacío/null) -> usuario: ${res.affectedRows}`);
    }

    if (hasRoleIdColumn) {
      // Alinear role_id nulos al id de 'usuario'
      const [[row]] = await conn.query("SELECT id FROM roles WHERE nombre = 'usuario'");
      if (row && row.id) {
        const [res] = await conn.execute("UPDATE users SET role_id = ? WHERE role_id IS NULL OR role_id = 0", [row.id]);
        updated += res.affectedRows || 0;
        console.log(`🛠️ Normalizados role_id null/0 -> usuario(${row.id}): ${res.affectedRows}`);
      } else {
        console.warn('⚠️ No se encontró el rol "usuario" en tabla roles');
      }
    }

    console.log(`✅ Normalización completada. Total filas afectadas: ${updated}`);
  } catch (err) {
    console.error('❌ Error normalizando roles:', err);
    process.exitCode = 1;
  } finally {
    if (conn) {
      await conn.end();
    }
  }
}

normalizeRoles();


