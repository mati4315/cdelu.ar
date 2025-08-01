const pool = require('./src/config/database');

async function checkUsers() {
  try {
    console.log('🔍 Verificando usuarios en la base de datos...\n');
    
    const [users] = await pool.execute('SELECT id, name, email, role, is_active FROM users');
    
    console.log(`📊 Total de usuarios: ${users.length}\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email})`);
      console.log(`   Rol: ${user.role}`);
      console.log(`   Activo: ${user.is_active ? 'Sí' : 'No'}`);
      console.log('');
    });
    
    // Probar login con el primer usuario
    if (users.length > 0) {
      const testUser = users[0];
      console.log(`🧪 Probando login con: ${testUser.email}`);
      
      const [loginTest] = await pool.execute(
        'SELECT id, name, email, password, role, is_active FROM users WHERE email = ?',
        [testUser.email]
      );
      
      if (loginTest.length > 0) {
        console.log('✅ Usuario encontrado en la base de datos');
        console.log(`   ID: ${loginTest[0].id}`);
        console.log(`   Nombre: ${loginTest[0].name}`);
        console.log(`   Email: ${loginTest[0].email}`);
        console.log(`   Rol: ${loginTest[0].role}`);
        console.log(`   Activo: ${loginTest[0].is_active ? 'Sí' : 'No'}`);
        console.log(`   Password hash: ${loginTest[0].password.substring(0, 20)}...`);
      } else {
        console.log('❌ Usuario no encontrado');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

checkUsers(); 