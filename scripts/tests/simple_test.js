const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const https = require('https');
const http = require('http');
require('dotenv').config();

/**
 * Función simple para hacer peticiones HTTP
 */
function makeRequest(url, options) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          statusText: res.statusMessage,
          headers: res.headers,
          data: data
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

/**
 * Script para probar el endpoint de estadísticas
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
    
    const response = await makeRequest('http://localhost:3001/api/v1/stats', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`📊 Status: ${response.status}`);
    console.log(`📊 Status Text: ${response.statusText}`);

    if (response.status === 200) {
      const data = JSON.parse(response.data);
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
      console.log('❌ Error en la respuesta:');
      console.log(response.data);
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