const pool = require('./src/config/database');
const bcrypt = require('bcrypt');

async function createAdminForSurveys() {
  console.log('👤 Creando usuario administrador para encuestas...');
  
  try {
    // Verificar si ya existe un usuario admin
    const [existingUsers] = await pool.execute(
      'SELECT id, username, email, role FROM users WHERE role = "admin" LIMIT 1'
    );
    
    if (existingUsers.length > 0) {
      const admin = existingUsers[0];
      console.log(`✅ Usuario administrador ya existe:`);
      console.log(`   - ID: ${admin.id}`);
      console.log(`   - Usuario: ${admin.username}`);
      console.log(`   - Email: ${admin.email}`);
      console.log(`   - Rol: ${admin.role}`);
      console.log('\n🔑 Para obtener el token de autenticación:');
      console.log('   1. Hacer login con las credenciales del admin');
      console.log('   2. Usar el token JWT en las requests del frontend');
      return admin;
    }
    
    // Crear nuevo usuario administrador
    const adminData = {
      username: 'survey_admin',
      email: 'survey_admin@cdelu.ar',
      password: 'survey123456',
      role: 'admin',
      full_name: 'Administrador de Encuestas',
      is_active: true
    };
    
    // Encriptar contraseña
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(adminData.password, saltRounds);
    
    // Insertar usuario administrador
    const [result] = await pool.execute(`
      INSERT INTO users (username, email, password, role, full_name, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      adminData.username,
      adminData.email,
      hashedPassword,
      adminData.role,
      adminData.full_name,
      adminData.is_active
    ]);
    
    const adminId = result.insertId;
    
    console.log(`✅ Usuario administrador creado exitosamente:`);
    console.log(`   - ID: ${adminId}`);
    console.log(`   - Usuario: ${adminData.username}`);
    console.log(`   - Email: ${adminData.email}`);
    console.log(`   - Contraseña: ${adminData.password}`);
    console.log(`   - Rol: ${adminData.role}`);
    
    console.log('\n🔑 Credenciales para el frontend:');
    console.log(`   Usuario: ${adminData.username}`);
    console.log(`   Contraseña: ${adminData.password}`);
    console.log(`   Email: ${adminData.email}`);
    
    console.log('\n📋 Para usar en el frontend:');
    console.log('   1. Hacer login con estas credenciales');
    console.log('   2. Obtener el token JWT de la respuesta');
    console.log('   3. Incluir el token en el header Authorization');
    console.log('   4. Ejemplo: Authorization: Bearer <token>');
    
    return {
      id: adminId,
      username: adminData.username,
      email: adminData.email,
      role: adminData.role
    };
    
  } catch (error) {
    console.error('❌ Error creando usuario administrador:', error);
    return null;
  } finally {
    await pool.end();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  createAdminForSurveys()
    .then(admin => {
      if (admin) {
        console.log('\n🎉 Usuario administrador listo para usar');
        console.log('🚀 El frontend puede ahora hacer requests de administración');
      } else {
        console.error('💥 Error creando el usuario administrador');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Error inesperado:', error);
      process.exit(1);
    });
}

module.exports = createAdminForSurveys; 