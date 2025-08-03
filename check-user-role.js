const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkUserRole() {
  let connection;
  
  try {
    console.log('🔍 Verificando estructura de la tabla users...');
    
    const config = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT, 10) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'trigamer_diario'
    };
    
    connection = await mysql.createConnection(config);
    
    // Verificar estructura de la tabla users
    const [columns] = await connection.execute(`
      DESCRIBE users
    `);
    
    console.log('📋 Estructura de la tabla users:');
    columns.forEach(col => {
      console.log(`   ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Verificar si el usuario existe usando email
    const [users] = await connection.execute(`
      SELECT id, email, rol FROM users WHERE email = 'lottery_admin@cdelu.ar'
    `);
    
    if (users.length === 0) {
      console.log('❌ Usuario lottery_admin@cdelu.ar no encontrado');
      return;
    }
    
    const user = users[0];
    console.log('\n📋 Usuario encontrado:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Rol actual: ${user.rol}`);
    
    if (user.rol !== 'administrador') {
      console.log('\n🔄 Actualizando rol a administrador...');
      await connection.execute(`
        UPDATE users SET rol = 'administrador' WHERE id = ?
      `, [user.id]);
      
      console.log('✅ Rol actualizado a administrador');
    } else {
      console.log('✅ El usuario ya tiene rol de administrador');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkUserRole(); 