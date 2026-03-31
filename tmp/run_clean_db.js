const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runCleanDB() {
    console.log('🧹 Iniciando limpieza de base de datos local...');
    
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT) || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'trigamer_diario',
            multipleStatements: true
        });

        const sqlPath = path.join(__dirname, '..', 'deploy_git', 'PRODUCTION_CLEAN_DATABASE.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Eliminar DELIMITER del SQL para mysql2
        const cleanSql = sql
            .replace(/DELIMITER \/\/[\s\S]*?DELIMITER ;/g, (match) => {
                return match
                    .replace(/DELIMITER \/\//g, '')
                    .replace(/DELIMITER ;/g, '')
                    .replace(/\/\//g, ';');
            });

        console.log('📝 Ejecutando script SQL...');
        await connection.query(cleanSql);
        
        console.log('✅ Base de datos limpiada correctamente.');
        console.log('👤 Usuario administrador restaurado: matias4315@gmail.com');
        
    } catch (error) {
        console.error('❌ Error ejecutando la limpieza:', error.message);
    } finally {
        if (connection) await connection.end();
    }
}

runCleanDB();
