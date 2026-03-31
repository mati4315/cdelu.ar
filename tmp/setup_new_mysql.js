const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setup() {
    console.log('🚀 Iniciando configuración de la nueva base de datos en Local...');
    
    const dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'w35115415'
    };

    let connection;
    try {
        console.log('🔌 Conectando a MySQL...');
        connection = await mysql.createConnection(dbConfig);
        
        const dbName = process.env.DB_NAME || 'trigamer_diario';
        console.log(`📂 Creando base de datos si no existe: ${dbName}...`);
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
        await connection.query(`USE \`${dbName}\``);

        console.log('📜 Ejecutando script de estructura y limpieza...');
        // Leemos el script SQL que preparamos para producción (que es el más completo)
        const sqlPath = path.join(__dirname, '..', 'deploy_git', 'backup_Cdelu_vacia_nueva_desde_cero.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // mysql2 no soporta múltiples sentencias por defecto en query(), 
        // así que las dividimos (esto es simplificado pero suele servir para scripts limpios)
        const queries = sql.split(';').filter(q => q.trim() !== '');
        
        for (let query of queries) {
            try {
                // Saltamos comandos de delimitador que mysql2 no digiere bien por query()
                if (query.toUpperCase().includes('DELIMITER')) continue;
                await connection.query(query);
            } catch (qErr) {
                console.log(`⚠️ Advertencia en consulta: ${qErr.message.substring(0, 100)}...`);
            }
        }

        console.log('✅ Base de datos configurada correctamente.');
        console.log('👤 Usuario Matias Admin creado con pass: @35115415');

    } catch (error) {
        console.error('❌ ERROR FATAL:', error.message);
    } finally {
        if (connection) await connection.end();
    }
}

setup();
