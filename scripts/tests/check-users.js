const mysql = require('mysql2/promise');

async function checkUsers() {
    try {
        // Configuración de la base de datos
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'trigamer_diario'
        });

        console.log('🔍 Verificando usuarios en la base de datos...\n');

        // Obtener todos los usuarios
        const [users] = await connection.execute('SELECT id, nombre, email, rol FROM users');
        
        console.log(`✅ Encontrados ${users.length} usuarios:\n`);
        
        users.forEach(user => {
            console.log(`👤 ID: ${user.id}`);
            console.log(`   Nombre: ${user.nombre}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Rol: ${user.rol}`);
            console.log('---');
        });

        // Buscar usuarios administradores específicamente
        const [admins] = await connection.execute('SELECT id, nombre, email FROM users WHERE rol = "administrador"');
        
        console.log(`\n🔑 Administradores encontrados: ${admins.length}`);
        admins.forEach(admin => {
            console.log(`   - ${admin.nombre} (${admin.email})`);
        });

        await connection.end();
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkUsers(); 