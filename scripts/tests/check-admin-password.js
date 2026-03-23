const pool = require('./src/config/database');
const bcrypt = require('bcryptjs');

async function checkAdminPassword() {
  console.log('🔍 Verificando usuario administrador...');
  
  try {
    // Buscar usuario administrador
    const [users] = await pool.execute(
      'SELECT id, nombre, email, password, rol FROM users WHERE email = ?',
      ['admin@trigamer.net']
    );
    
    if (users.length === 0) {
      console.log('❌ Usuario admin@trigamer.net no encontrado');
      return;
    }
    
    const user = users[0];
    console.log('✅ Usuario encontrado:');
    console.log(`   - ID: ${user.id}`);
    console.log(`   - Nombre: ${user.nombre}`);
    console.log(`   - Email: ${user.email}`);
    console.log(`   - Rol: ${user.rol}`);
    console.log(`   - Password hash: ${user.password.substring(0, 20)}...`);
    
    // Probar contraseñas comunes
    const testPasswords = [
      'admin123',
      'admin',
      'password',
      '123456',
      'admin@trigamer.net',
      'trigamer',
      'administrador'
    ];
    
    console.log('\n🔐 Probando contraseñas...');
    for (const password of testPasswords) {
      const isValid = await bcrypt.compare(password, user.password);
      console.log(`   - "${password}": ${isValid ? '✅ VÁLIDA' : '❌ inválida'}`);
      
      if (isValid) {
        console.log(`\n🎉 ¡Contraseña encontrada: "${password}"`);
        return password;
      }
    }
    
    console.log('\n❌ Ninguna contraseña de prueba funcionó');
    console.log('💡 Puedes crear una nueva contraseña con:');
    console.log('   node create-admin-correct.js');
    
  } catch (error) {
    console.error('💥 Error:', error.message);
  } finally {
    await pool.end();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  checkAdminPassword()
    .then(password => {
      if (password) {
        console.log(`\n📋 Usa esta contraseña en el script de prueba: ${password}`);
      }
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Error inesperado:', error);
      process.exit(1);
    });
}

module.exports = checkAdminPassword; 