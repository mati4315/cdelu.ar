const pool = require('./src/config/database');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  console.log('👤 Creando usuario administrador matias...');
  
  try {
    const email = 'matias@cdelu.ar';
    const password = '35115415';
    const nombre = 'matias';
    const role_id = 1;
    
    // Verificar si el usuario ya existe por nombre o email
    const [existingUsers] = await pool.execute(
      'SELECT id, email FROM users WHERE nombre = ? OR email = ?',
      [nombre, email]
    );
    
    if (existingUsers.length > 0) {
      console.log('⚠️ Usuario ya existe, actualizando contraseña...');
      
      const userId = existingUsers[0].id;
      const hashedPassword = await bcrypt.hash(password, 10);
      
      await pool.execute(
        'UPDATE users SET password = ?, role_id = ?, nombre = ?, email = ? WHERE id = ?',
        [hashedPassword, role_id, nombre, email, userId]
      );
      
      console.log('✅ Contraseña actualizada correctamente');
    } else {
      console.log('➕ Creando nuevo usuario administrador...');
      
      const hashedPassword = await bcrypt.hash(password, 10);
      const [result] = await pool.execute(
        'INSERT INTO users (nombre, email, password, role_id) VALUES (?, ?, ?, ?)',
        [nombre, email, hashedPassword, role_id]
      );
      
      console.log('✅ Usuario creado correctamente');
      console.log(`   - ID: ${result.insertId}`);
    }
    
    const [users] = await pool.execute(
      'SELECT id, nombre, email, role_id FROM users WHERE nombre = ?',
      [nombre]
    );
    
    if (users.length > 0) {
      const user = users[0];
      console.log('\n✅ Usuario administrador listo:');
      console.log(`   - ID: ${user.id}`);
      console.log(`   - Nombre: ${user.nombre}`);
      console.log(`   - Email: ${user.email}`);
      console.log(`   - Rol ID: ${user.role_id}`);
      console.log(`   - Contraseña: ${password}`);
    }
  } catch (error) {
    console.error('❌ Error creando usuario:', error.message);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  createAdmin()
    .then(() => {
      console.log('\n🎉 Usuario administrador matias creado/actualizado exitosamente');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Error inesperado:', error);
      process.exit(1);
    });
}

module.exports = createAdmin;
