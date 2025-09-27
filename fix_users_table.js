/**
 * Script para arreglar la tabla users en trigamer_diario
 */

require('dotenv').config();

async function fixUsersTable() {
  console.log('🔧 Arreglando tabla users en trigamer_diario...\n');

  try {
    const pool = require('./src/config/database');
    
    console.log('1️⃣ Verificando estructura actual de users...');
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('Columnas actuales:');
    console.table(columns.map(col => ({
      nombre: col.COLUMN_NAME,
      tipo: col.DATA_TYPE,
      nulo: col.IS_NULLABLE,
      defecto: col.COLUMN_DEFAULT
    })));

    console.log('\n2️⃣ Verificando si existe role_id...');
    const roleIdExists = columns.some(col => col.COLUMN_NAME === 'role_id');
    
    if (!roleIdExists) {
      console.log('⚠️  Campo role_id no existe. Agregándolo...');
      
      // Agregar campo role_id
      await pool.execute(`
        ALTER TABLE users 
        ADD COLUMN role_id INT NOT NULL DEFAULT 3 AFTER password,
        ADD FOREIGN KEY (role_id) REFERENCES roles(id)
      `);
      
      console.log('✅ Campo role_id agregado con valor por defecto 3 (usuario)');
      
      // Verificar si hay usuarios admin/colaborador basándose en otros criterios
      console.log('\n3️⃣ Asignando roles apropiados...');
      
      // Buscar usuarios que parezcan administradores
      const [adminUsers] = await pool.execute(`
        SELECT id, nombre, email 
        FROM users 
        WHERE LOWER(nombre) LIKE '%admin%' 
        OR LOWER(email) LIKE '%admin%'
        OR LOWER(nombre) LIKE '%matias%'
      `);
      
      if (adminUsers.length > 0) {
        console.log('📝 Usuarios identificados como administradores:');
        for (const user of adminUsers) {
          await pool.execute('UPDATE users SET role_id = 1 WHERE id = ?', [user.id]);
          console.log(`   👑 ${user.nombre} (${user.email}) → administrador`);
        }
      }
      
    } else {
      console.log('✅ Campo role_id ya existe');
    }

    console.log('\n4️⃣ Probando consulta de usuario...');
    
    // Probar la consulta que falló
    const [testUser] = await pool.execute(`
      SELECT 
        u.id, u.nombre, u.email, u.username, u.bio, u.location, 
        u.website, u.is_verified, u.profile_picture_url, u.created_at, 
        r.nombre as role
      FROM users u 
      LEFT JOIN roles r ON u.role_id = r.id 
      WHERE u.username LIKE '%admin%'
      LIMIT 1
    `);
    
    if (testUser.length > 0) {
      console.log('✅ Consulta exitosa. Usuario encontrado:');
      console.table(testUser[0]);
    } else {
      console.log('⚠️  No se encontraron usuarios con "admin" en el username');
      
      // Mostrar algunos usuarios disponibles
      const [someUsers] = await pool.execute(`
        SELECT id, nombre, username, email 
        FROM users 
        WHERE username IS NOT NULL 
        LIMIT 5
      `);
      
      console.log('\n📋 Usuarios disponibles:');
      console.table(someUsers);
    }

    console.log('\n🎉 ¡Tabla users arreglada!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

fixUsersTable();
