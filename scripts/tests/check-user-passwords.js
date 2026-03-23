const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function checkUserPasswords() {
    try {
        // Configuración de la base de datos
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'trigamer_diario'
        });

        console.log('🔍 Verificando usuarios y contraseñas...\n');

        // Obtener todos los usuarios con sus contraseñas
        const [users] = await connection.execute('SELECT id, nombre, email, password, rol FROM users');
        
        console.log(`✅ Encontrados ${users.length} usuarios:\n`);
        
        users.forEach(user => {
            console.log(`👤 ID: ${user.id}`);
            console.log(`   Nombre: ${user.nombre}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Rol: ${user.rol}`);
            console.log(`   Password hash: ${user.password.substring(0, 20)}...`);
            console.log('---');
        });

        // Probar contraseñas comunes
        const commonPasswords = [
            'admin123',
            'admin',
            'password',
            '123456',
            'admin@123',
            'trigamer123',
            'cdelu123'
        ];

        console.log('\n🔐 Probando contraseñas comunes...\n');

        for (const user of users) {
            console.log(`🧪 Probando usuario: ${user.email}`);
            
            for (const password of commonPasswords) {
                try {
                    const isValid = await bcrypt.compare(password, user.password);
                    if (isValid) {
                        console.log(`   ✅ Contraseña encontrada: "${password}"`);
                        break;
                    }
                } catch (error) {
                    // Si bcrypt falla, probar con hash directo
                    if (user.password === password) {
                        console.log(`   ✅ Contraseña directa: "${password}"`);
                        break;
                    }
                }
            }
            console.log('---');
        }

        await connection.end();
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkUserPasswords(); 