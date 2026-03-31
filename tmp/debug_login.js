const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function debugLogin() {
    console.log('🔍 Iniciando Diagnóstico de Login en Local...');
    
    let connection;
    try {
        console.log(`🔌 Conectando a DB: ${process.env.DB_NAME || 'trigamer_diario'}...`);
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'trigamer_diario'
        });

        const email = 'matias4315@gmail.com';
        const psw = 'w35115415';

        console.log(`🔎 Buscando usuario: ${email}...`);
        const [rows] = await connection.query(
            `SELECT u.*, r.nombre as rol 
             FROM users u 
             LEFT JOIN roles r ON u.role_id = r.id 
             WHERE u.email = ?`,
            [email]
        );

        if (rows.length === 0) {
            console.log('❌ ERROR: Usuario no encontrado en la base de datos.');
            return;
        }

        const user = rows[0];
        console.log('✅ Usuario encontrado:', { 
            id: user.id, 
            nombre: user.nombre, 
            email: user.email, 
            rol: user.rol,
            has_password: !!user.password 
        });

        if (!user.rol) {
            console.log('❌ ERROR: El usuario no tiene un ROL asignado o la tabla de ROLES está vacía/mal vinculada.');
        }

        console.log('🔐 Verificando contraseña (bcrypt)...');
        try {
            const isValid = await bcrypt.compare(psw, user.password);
            console.log(isValid ? '✅ Contraseña VÁLIDA' : '❌ Contraseña INVÁLIDA');
        } catch (bcryptErr) {
            console.log('❌ ERROR CRÍTICO en bcrypt:', bcryptErr.message);
        }

    } catch (error) {
        console.error('❌ ERROR GENERAL:', error.message);
        if (error.code === 'ER_BAD_TABLE_ERROR') {
            console.log('💡 Sugerencia: Falta una tabla en la base de datos.');
        }
    } finally {
        if (connection) await connection.end();
    }
}

debugLogin();
