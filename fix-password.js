const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function fixPassword() {
    console.log('🔧 Corrigiendo contraseña del usuario...');
    
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            port: 3306,
            user: 'root',
            password: '',
            database: 'trigamer_diario'
        });
        
        // Generar hash correcto para 'password'
        const saltRounds = 10;
        const password = 'password';
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        console.log('📝 Actualizando contraseña...');
        
        // Actualizar contraseña del usuario test
        await connection.execute(
            'UPDATE users SET password = ? WHERE email = ?',
            [hashedPassword, 'test@test.com']
        );
        
        // Verificar que se actualizó
        const [users] = await connection.execute(
            'SELECT id, name, email, role FROM users WHERE email = ?',
            ['test@test.com']
        );
        
        console.log('✅ Usuario actualizado:', users[0]);
        console.log('🔑 Contraseña actualizada a: password');
        
        await connection.end();
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

fixPassword(); 