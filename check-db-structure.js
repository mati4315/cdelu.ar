const mysql = require('mysql2/promise');

async function checkDBStructure() {
    console.log('🔍 Verificando estructura de la base de datos...');
    
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            port: 3306,
            user: 'root',
            password: '',
            database: 'trigamer_diario'
        });
        
        // Verificar estructura de tabla users
        console.log('📝 Verificando tabla users...');
        const [usersStructure] = await connection.execute('DESCRIBE users');
        console.log('✅ Estructura de users:', usersStructure);
        
        // Verificar datos de usuarios
        console.log('📝 Verificando usuarios...');
        const [users] = await connection.execute('SELECT id, name, email, role, password FROM users');
        console.log('✅ Usuarios:', users);
        
        // Verificar si existe tabla roles
        console.log('📝 Verificando tabla roles...');
        const [tables] = await connection.execute('SHOW TABLES LIKE "roles"');
        console.log('✅ Tabla roles existe:', tables.length > 0);
        
        if (tables.length > 0) {
            const [rolesStructure] = await connection.execute('DESCRIBE roles');
            console.log('✅ Estructura de roles:', rolesStructure);
        }
        
        await connection.end();
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkDBStructure(); 