const pool = require('./src/config/database');
const bcrypt = require('bcrypt');

async function createAdminCorrect() {
  console.log('👤 Creando usuario administrador para encuestas...');
  
  try {
    // Verificar si ya existe un usuario admin
    const [existingUsers] = await pool.execute(
      "SELECT id, nombre, email, rol FROM users WHERE rol = 'administrador' LIMIT 1"
    );
    
    if (existingUsers.length > 0) {
      const admin = existingUsers[0];
      console.log(`✅ Usuario administrador ya existe:`);
      console.log(`   - ID: ${admin.id}`);
      console.log(`   - Nombre: ${admin.nombre}`);
      console.log(`   - Email: ${admin.email}`);
      console.log(`   - Rol: ${admin.rol}`);
      console.log('\n🔑 Para obtener el token de autenticación:');
      console.log('   1. Hacer login con las credenciales del admin');
      console.log('   2. Usar el token JWT en las requests del frontend');
      return admin;
    }
    
    // Crear nuevo usuario administrador
    const adminData = {
      nombre: 'Administrador Encuestas',
      email: 'survey_admin@cdelu.ar',
      password: 'survey123456',
      rol: 'administrador'
    };
    
    // Encriptar contraseña
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(adminData.password, saltRounds);
    
    // Insertar usuario administrador
    const [result] = await pool.execute(`
      INSERT INTO users (nombre, email, password, rol, created_at, updated_at)
      VALUES (?, ?, ?, ?, NOW(), NOW())
    `, [
      adminData.nombre,
      adminData.email,
      hashedPassword,
      adminData.rol
    ]);
    
    const adminId = result.insertId;
    
    console.log(`✅ Usuario administrador creado exitosamente:`);
    console.log(`   - ID: ${adminId}`);
    console.log(`   - Nombre: ${adminData.nombre}`);
    console.log(`   - Email: ${adminData.email}`);
    console.log(`   - Contraseña: ${adminData.password}`);
    console.log(`   - Rol: ${adminData.rol}`);
    
    console.log('\n🔑 Credenciales para el frontend:');
    console.log(`   Email: ${adminData.email}`);
    console.log(`   Contraseña: ${adminData.password}`);
    
    console.log('\n📋 Para usar en el frontend:');
    console.log('   1. Hacer login con estas credenciales');
    console.log('   2. Obtener el token JWT de la respuesta');
    console.log('   3. Incluir el token en el header Authorization');
    console.log('   4. Ejemplo: Authorization: Bearer <token>');
    
    console.log('\n🎯 Endpoints que requieren autenticación:');
    console.log('   - PUT /api/v1/surveys/:id (actualizar encuesta)');
    console.log('   - POST /api/v1/surveys (crear encuesta)');
    console.log('   - DELETE /api/v1/surveys/:id (eliminar encuesta)');
    
    return {
      id: adminId,
      nombre: adminData.nombre,
      email: adminData.email,
      rol: adminData.rol
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
  createAdminCorrect()
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

module.exports = createAdminCorrect; 