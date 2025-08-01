const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * Script para generar un token JWT válido
 * Uso: node generate_valid_token.js
 */
async function generateValidToken() {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'trigamer_diario',
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0
  };

  let pool;
  try {
    console.log('🔑 GENERANDO TOKEN JWT VÁLIDO');
    console.log('================================');
    
    // Mostrar configuración (sin contraseña)
    console.log('📋 Configuración actual:');
    console.log(`  - DB_HOST: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`  - DB_USER: ${process.env.DB_USER || 'root'}`);
    console.log(`  - DB_NAME: ${process.env.DB_NAME || 'trigamer_diario'}`);
    console.log(`  - JWT_SECRET: ${process.env.JWT_SECRET ? '***configurado***' : 'tu_secreto_super_seguro (por defecto)'}`);
    
    // Crear pool de conexión
    pool = mysql.createPool(config);
    
    // Obtener usuario administrador
    const [adminUsers] = await pool.query(
      'SELECT id, nombre, email, rol FROM users WHERE rol = "administrador" LIMIT 1'
    );

    if (adminUsers.length === 0) {
      console.log('❌ No se encontró ningún usuario administrador');
      return;
    }

    const admin = adminUsers[0];
    console.log(`\n👤 Usuario administrador encontrado:`);
    console.log(`  - ID: ${admin.id}`);
    console.log(`  - Nombre: ${admin.nombre}`);
    console.log(`  - Email: ${admin.email}`);
    console.log(`  - Rol: ${admin.rol}`);

    // Generar token JWT usando la misma configuración que el servidor
    const jwtSecret = process.env.JWT_SECRET || 'tu_secreto_super_seguro';
    const token = jwt.sign({
      id: admin.id,
      email: admin.email,
      rol: admin.rol
    }, jwtSecret, { expiresIn: '1d' });

    console.log(`\n🔑 Token JWT generado:`);
    console.log(token);
    
    console.log(`\n📝 Para usar en el dashboard:`);
    console.log(`1. Abre la consola del navegador (F12)`);
    console.log(`2. Ejecuta: localStorage.setItem('authToken', '${token}')`);
    console.log(`3. Recarga la página`);
    
    console.log(`\n📝 Para probar con curl:`);
    console.log(`curl -X GET "http://localhost:3001/api/v1/stats" \\`);
    console.log(`  -H "Authorization: Bearer ${token}" \\`);
    console.log(`  -H "Content-Type: application/json"`);

  } catch (error) {
    console.error('❌ Error al generar token:', error.message);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

// Ejecutar el script
generateValidToken()
  .then(() => {
    console.log('\n✅ Token generado exitosamente');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error inesperado:', error);
    process.exit(1);
  }); 