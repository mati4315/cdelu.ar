const pool = require('./src/config/database');
const bcrypt = require('bcryptjs');

async function createAdminMatias() {
  console.log('👤 Creando usuario administrador...');
  
  try {
    const email = 'matias4315@gmail.com';
    const password = 'w35115415';
    const nombre = 'Matias Administrador';
    const rol = 'administrador';
    
    // Verificar si el usuario ya existe
    const [existingUsers] = await pool.execute(
      'SELECT id, email FROM users WHERE email = ?',
      [email]
    );
    
    if (existingUsers.length > 0) {
      console.log('⚠️ Usuario ya existe, actualizando contraseña...');
      
      // Actualizar contraseña
      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.execute(
        'UPDATE users SET password = ?, rol = ? WHERE email = ?',
        [hashedPassword, rol, email]
      );
      
      console.log('✅ Contraseña actualizada correctamente');
    } else {
      console.log('➕ Creando nuevo usuario administrador...');
      
      // Crear nuevo usuario
      const hashedPassword = await bcrypt.hash(password, 10);
      const [result] = await pool.execute(
        'INSERT INTO users (nombre, email, password, rol) VALUES (?, ?, ?, ?)',
        [nombre, email, hashedPassword, rol]
      );
      
      console.log('✅ Usuario creado correctamente');
      console.log(`   - ID: ${result.insertId}`);
    }
    
    // Verificar que el usuario existe
    const [users] = await pool.execute(
      'SELECT id, nombre, email, rol FROM users WHERE email = ?',
      [email]
    );
    
    if (users.length > 0) {
      const user = users[0];
      console.log('\n✅ Usuario administrador listo:');
      console.log(`   - ID: ${user.id}`);
      console.log(`   - Nombre: ${user.nombre}`);
      console.log(`   - Email: ${user.email}`);
      console.log(`   - Rol: ${user.rol}`);
      console.log(`   - Contraseña: ${password}`);
    }
    
  } catch (error) {
    console.error('❌ Error creando usuario:', error.message);
  } finally {
    await pool.end();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  createAdminMatias()
    .then(() => {
      console.log('\n🎉 Usuario administrador creado/actualizado exitosamente');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Error inesperado:', error);
      process.exit(1);
    });
}

module.exports = createAdminMatias; 