const pool = require('./src/config/database');

async function checkUsersTable() {
  console.log('🔍 Verificando estructura de la tabla users...');
  
  try {
    // Verificar si la tabla users existe
    const [tables] = await pool.execute("SHOW TABLES LIKE 'users'");
    
    if (tables.length === 0) {
      console.log('❌ La tabla users no existe');
      return;
    }
    
    console.log('✅ Tabla users existe');
    
    // Obtener estructura de la tabla
    const [columns] = await pool.execute('DESCRIBE users');
    console.log('\n📋 Estructura de la tabla users:');
    columns.forEach(column => {
      console.log(`   - ${column.Field}: ${column.Type} ${column.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Verificar usuarios existentes
    const [users] = await pool.execute('SELECT * FROM users LIMIT 3');
    console.log('\n👥 Usuarios existentes:');
    if (users.length === 0) {
      console.log('   - No hay usuarios en la tabla');
    } else {
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. ID: ${user.id}, Campos: ${Object.keys(user).join(', ')}`);
      });
    }
    
    // Verificar si hay algún admin
    const [admins] = await pool.execute("SELECT * FROM users WHERE role = 'admin' OR role LIKE '%admin%' LIMIT 3");
    console.log('\n👑 Administradores encontrados:');
    if (admins.length === 0) {
      console.log('   - No hay administradores en la tabla');
    } else {
      admins.forEach((admin, index) => {
        console.log(`   ${index + 1}. ID: ${admin.id}, Rol: ${admin.role}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error verificando tabla users:', error);
  } finally {
    await pool.end();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  checkUsersTable()
    .then(() => {
      console.log('\n🏁 Verificación completada');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Error inesperado:', error);
      process.exit(1);
    });
}

module.exports = checkUsersTable; 