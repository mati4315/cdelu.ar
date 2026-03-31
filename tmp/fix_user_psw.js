const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function fixUser() {
    console.log('🛠️ Iniciando reparación de usuario Matias...');
    const dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'w35115415',
        database: process.env.DB_NAME || 'trigamer_diario'
    };

    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const email = 'matias4315@gmail.com';
        const newPsw = '@35115415';
        const hash = bcrypt.hashSync(newPsw, 10);

        console.log(`🔑 Generando nuevo hash para: ${newPsw}`);
        const [result] = await connection.query(
            'UPDATE users SET password = ? WHERE email = ?',
            [hash, email]
        );

        if (result.affectedRows > 0) {
            console.log('✅ ÉXITO: Usuario actualizado correctamente con el nuevo hash.');
            
            // Verificación inmediata
            const [rows] = await connection.query('SELECT password FROM users WHERE email = ?', [email]);
            const isMatch = bcrypt.compareSync(newPsw, rows[0].password);
            console.log(isMatch ? '✅ VERIFICACIÓN: La contraseña coincide al 100%.' : '❌ ERROR: La verificación falló.');
        } else {
            console.log('❌ ERROR: No se encontró el usuario matias4315@gmail.com');
        }

    } catch (err) {
        console.error('❌ ERROR FATAL:', err.message);
    } finally {
        if (connection) await connection.end();
    }
}

fixUser();
