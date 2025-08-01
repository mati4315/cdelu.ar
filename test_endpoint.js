const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * Script para probar el endpoint de estadísticas
 * Uso: node test_endpoint.js
 */
async function testEndpoint() {
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
    console.log('🧪 PROBANDO ENDPOINT DE ESTADÍSTICAS');
    console.log('=====================================');
    
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
    console.log(`👤 Usando administrador: ${admin.nombre} (${admin.email})`);

    // Generar token JWT
    const jwtSecret = process.env.JWT_SECRET || 'tu_secreto_super_seguro';
    const token = jwt.sign({
      id: admin.id,
      email: admin.email,
      rol: admin.rol
    }, jwtSecret, { expiresIn: '1d' });

    console.log(`🔑 Token generado: ${token.substring(0, 50)}...`);

    // Probar el endpoint
    console.log('\n🌐 PROBANDO ENDPOINT /api/v1/stats...');
    
    const response = await fetch('http://localhost:3001/api/v1/stats', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`📊 Status: ${response.status}`);
    console.log(`📊 Status Text: ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Respuesta exitosa:');
      console.log(JSON.stringify(data, null, 2));
      
      // Verificar que los datos coinciden con la base de datos
      console.log('\n🔍 VERIFICANDO DATOS...');
      
      const [newsCount] = await pool.query('SELECT COUNT(*) as total FROM news');
      const [usersCount] = await pool.query('SELECT COUNT(*) as total FROM users');
      const [commentsCount] = await pool.query('SELECT COUNT(*) as total FROM comments');
      const [comCount] = await pool.query('SELECT COUNT(*) as total FROM com');
      const [feedCount] = await pool.query('SELECT COUNT(*) as total FROM content_feed');
      const [likesCount] = await pool.query('SELECT (SELECT COUNT(*) FROM likes) + (SELECT COUNT(*) FROM com_likes) as total');
      const [comCommentsCount] = await pool.query('SELECT COUNT(*) as total FROM com_comments');

      const expectedData = {
        totalNews: newsCount[0].total,
        totalUsers: usersCount[0].total,
        totalComments: commentsCount[0].total,
        totalCom: comCount[0].total,
        totalFeed: feedCount[0].total,
        totalLikes: likesCount[0].total,
        totalComComments: comCommentsCount[0].total
      };

      console.log('📊 Datos esperados:');
      console.log(JSON.stringify(expectedData, null, 2));

      // Comparar datos
      const isMatch = JSON.stringify(data) === JSON.stringify(expectedData);
      console.log(`\n${isMatch ? '✅' : '❌'} Los datos coinciden: ${isMatch}`);

    } else {
      const errorData = await response.text();
      console.log('❌ Error en la respuesta:');
      console.log(errorData);
    }

  } catch (error) {
    console.error('❌ Error durante la prueba:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ No se puede conectar al servidor. Asegúrate de que esté ejecutándose en puerto 3001.');
    } else if (error.code === 'ENOTFOUND') {
      console.error('❌ No se puede resolver localhost. Verifica la configuración de red.');
    }
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

// Ejecutar la prueba
testEndpoint()
  .then(() => {
    console.log('\n✅ Prueba completada');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error inesperado:', error);
    process.exit(1);
  }); 