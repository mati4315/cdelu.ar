const mysql = require('mysql2/promise');

async function checkAdminUser() {
  console.log('🔍 Verificando usuario administrador...\n');

  try {
    // Configuración de la base de datos
    const pool = mysql.createPool({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'trigamer_diario',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // Verificar conexión
    console.log('1️⃣ Verificando conexión a la base de datos...');
    const [testResult] = await pool.execute('SELECT 1 as test');
    console.log('✅ Conexión a BD exitosa');

    // Verificar si la tabla users existe
    console.log('\n2️⃣ Verificando tabla users...');
    const [tables] = await pool.execute("SHOW TABLES LIKE 'users'");
    if (tables.length > 0) {
      console.log('✅ Tabla users existe');
    } else {
      console.log('❌ Tabla users NO existe');
      return;
    }

    // Verificar estructura de la tabla users
    console.log('\n3️⃣ Verificando estructura de la tabla users...');
    const [columns] = await pool.execute("DESCRIBE users");
    console.log('📋 Columnas de la tabla users:');
    columns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type}`);
    });

    // Buscar usuario administrador
    console.log('\n4️⃣ Buscando usuario administrador...');
    const [users] = await pool.execute("SELECT * FROM users WHERE email = 'matias4315@gmail.com'");
    
    if (users.length > 0) {
      const user = users[0];
      console.log('✅ Usuario encontrado:');
      console.log(`  - ID: ${user.id}`);
      console.log(`  - Email: ${user.email}`);
      console.log(`  - Nombre: ${user.nombre}`);
      console.log(`  - Rol: ${user.rol}`);
    } else {
      console.log('❌ Usuario matias4315@gmail.com NO encontrado');
      
      // Mostrar todos los usuarios
      console.log('\n📋 Todos los usuarios en la base de datos:');
      const [allUsers] = await pool.execute("SELECT id, email, nombre, rol FROM users");
      allUsers.forEach(user => {
        console.log(`  - ID: ${user.id}, Email: ${user.email}, Nombre: ${user.nombre}, Rol: ${user.rol}`);
      });
    }

    // Verificar usuarios con rol administrador
    console.log('\n5️⃣ Verificando usuarios con rol administrador...');
    const [adminUsers] = await pool.execute("SELECT id, email, nombre, rol FROM users WHERE rol = 'administrador'");
    
    if (adminUsers.length > 0) {
      console.log('✅ Usuarios administradores encontrados:');
      adminUsers.forEach(user => {
        console.log(`  - ID: ${user.id}, Email: ${user.email}, Nombre: ${user.nombre}, Rol: ${user.rol}`);
      });
    } else {
      console.log('❌ No hay usuarios con rol administrador');
    }

    await pool.end();
    console.log('\n🎉 Verificación completada');

  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

checkAdminUser(); 