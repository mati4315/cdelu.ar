const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * Script de diagnóstico para verificar estadísticas del dashboard
 * Uso: node debug_stats.js
 */
async function debugStats() {
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
    console.log('🔍 INICIANDO DIAGNÓSTICO DE ESTADÍSTICAS');
    console.log('==========================================');
    
    // Crear pool de conexión
    pool = mysql.createPool(config);
    
    // Verificar conexión
    const connection = await pool.getConnection();
    console.log('✅ Conexión a la base de datos establecida');
    connection.release();

    // Verificar que las tablas existen
    console.log('\n📋 VERIFICANDO TABLAS...');
    const [tables] = await pool.query('SHOW TABLES');
    console.log('Tablas encontradas:', tables.map(t => Object.values(t)[0]));

    // Verificar datos en cada tabla
    console.log('\n📊 CONTANDO REGISTROS...');
    
    // Usuarios
    const [usersCount] = await pool.query('SELECT COUNT(*) as total FROM users');
    console.log(`👥 Usuarios: ${usersCount[0].total}`);
    
    // Noticias
    const [newsCount] = await pool.query('SELECT COUNT(*) as total FROM news');
    console.log(`📰 Noticias: ${newsCount[0].total}`);
    
    // Comentarios
    const [commentsCount] = await pool.query('SELECT COUNT(*) as total FROM comments');
    console.log(`💭 Comentarios: ${commentsCount[0].total}`);
    
    // Comunidad
    const [comCount] = await pool.query('SELECT COUNT(*) as total FROM com');
    console.log(`💬 Comunidad: ${comCount[0].total}`);
    
    // Feed unificado
    const [feedCount] = await pool.query('SELECT COUNT(*) as total FROM content_feed');
    console.log(`📑 Feed unificado: ${feedCount[0].total}`);
    
    // Likes
    const [likesCount] = await pool.query('SELECT (SELECT COUNT(*) FROM likes) + (SELECT COUNT(*) FROM com_likes) as total');
    console.log(`👍 Likes totales: ${likesCount[0].total}`);
    
    // Comentarios de comunidad
    const [comCommentsCount] = await pool.query('SELECT COUNT(*) as total FROM com_comments');
    console.log(`💬 Comentarios comunidad: ${comCommentsCount[0].total}`);

    // Verificar usuario administrador
    console.log('\n👤 VERIFICANDO USUARIO ADMINISTRADOR...');
    const [adminUsers] = await pool.query('SELECT id, nombre, email, rol FROM users WHERE rol = "administrador"');
    console.log('Usuarios administradores encontrados:', adminUsers.length);
    adminUsers.forEach(user => {
      console.log(`  - ID: ${user.id}, Nombre: ${user.nombre}, Email: ${user.email}, Rol: ${user.rol}`);
    });

    // Simular la respuesta que debería devolver el endpoint
    console.log('\n📤 RESPUESTA SIMULADA DEL ENDPOINT /api/v1/stats:');
    const simulatedResponse = {
      totalNews: newsCount[0].total,
      totalUsers: usersCount[0].total,
      totalComments: commentsCount[0].total,
      totalCom: comCount[0].total,
      totalFeed: feedCount[0].total,
      totalLikes: likesCount[0].total,
      totalComComments: comCommentsCount[0].total
    };
    console.log(JSON.stringify(simulatedResponse, null, 2));

    // Verificar si hay datos de prueba
    console.log('\n🧪 VERIFICANDO DATOS DE PRUEBA...');
    const [testNews] = await pool.query('SELECT * FROM news LIMIT 3');
    console.log(`Noticias de prueba: ${testNews.length}`);
    testNews.forEach(news => {
      console.log(`  - ID: ${news.id}, Título: ${news.titulo}`);
    });

    const [testCom] = await pool.query('SELECT * FROM com LIMIT 3');
    console.log(`Posts de comunidad: ${testCom.length}`);
    testCom.forEach(com => {
      console.log(`  - ID: ${com.id}, Título: ${com.titulo}`);
    });

    console.log('\n✅ DIAGNÓSTICO COMPLETADO');
    console.log('==========================================');

  } catch (error) {
    console.error('❌ Error durante el diagnóstico:', error.message);
    
    if (error.code === 'ER_NO_SUCH_TABLE') {
      console.error('❌ Las tablas no existen. Ejecuta primero el script de creación de tablas.');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('❌ Error de acceso a la base de datos. Verifica las credenciales.');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('❌ No se puede conectar al servidor MySQL. Verifica que esté ejecutándose.');
    }
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

// Ejecutar el diagnóstico
debugStats()
  .then(() => {
    console.log('✅ Diagnóstico completado');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error inesperado:', error);
    process.exit(1);
  }); 