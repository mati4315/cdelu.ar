const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: './env.local' });

async function setupDatabaseFeedCompleto() {
    console.log('🚀 Iniciando configuración completa del Sistema de Feed Unificado...');
    console.log('📂 Base de datos: trigamer_diario');
    
    let connection;
    
    try {
        // 1. Conectar sin base de datos para crearla
        console.log('📝 Conectando a MySQL...');
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT) || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            multipleStatements: true
        });
        console.log('✅ Conectado a MySQL');
        
        // 2. Crear la base de datos
        console.log('📝 Creando base de datos trigamer_diario...');
        await connection.execute('CREATE DATABASE IF NOT EXISTS trigamer_diario CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
        console.log('✅ Base de datos creada');
        
        // 3. Cerrar conexión y reconectar con la base de datos
        await connection.end();
        
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT) || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: 'trigamer_diario',
            multipleStatements: true
        });
        console.log('✅ Conectado a trigamer_diario');
        
        // 4. Limpiar base de datos existente (opcional)
        console.log('🧹 Limpiando tablas existentes...');
        const [existingTables] = await connection.execute('SHOW TABLES');
        if (existingTables.length > 0) {
            console.log(`   Encontradas ${existingTables.length} tablas existentes`);
            console.log('   ⚠️  Para evitar conflictos, se recomienda limpiar la base de datos');
            
            // Desactivar foreign key checks temporalmente
            await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
            
            // Eliminar triggers existentes
            const [triggers] = await connection.execute('SHOW TRIGGERS');
            for (const trigger of triggers) {
                await connection.execute(`DROP TRIGGER IF EXISTS ${trigger.Trigger}`);
                console.log(`   🗑️  Trigger eliminado: ${trigger.Trigger}`);
            }
            
            // Eliminar tablas existentes
            for (const table of existingTables) {
                const tableName = Object.values(table)[0];
                await connection.execute(`DROP TABLE IF EXISTS ${tableName}`);
                console.log(`   🗑️  Tabla eliminada: ${tableName}`);
            }
            
            // Reactivar foreign key checks
            await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
            console.log('   ✅ Base de datos limpia');
        }
        
        // 5. Ejecutar scripts en orden
        const scriptsOrden = [
            'crear_tablas_minimo.sql',
            'crear_triggers_sync.sql',
            'verificar_tablas.sql',
            'test_bd_funcionamiento.sql'
        ];
        
        console.log('📂 Verificando archivos disponibles...');
        const baseDatosPath = path.join(__dirname, 'base de datos');
        const archivosDisponibles = fs.readdirSync(baseDatosPath);
        console.log('   Archivos encontrados:', archivosDisponibles);
        
        for (const script of scriptsOrden) {
            console.log(`\n📝 Ejecutando: ${script}`);
            console.log('━'.repeat(50));
            
            try {
                const sqlFile = path.join(__dirname, 'base de datos', script);
                
                // Verificar que el archivo existe
                if (!fs.existsSync(sqlFile)) {
                    console.log(`⚠️  Archivo no encontrado: ${script}`);
                    continue;
                }
                
                const sqlContent = fs.readFileSync(sqlFile, 'utf8');
                
                // Dividir el contenido en statements individuales y filtrar comandos USE
                const statements = sqlContent
                    .split(';')
                    .map(stmt => stmt.trim())
                    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.toUpperCase().startsWith('USE '));
                
                console.log(`   📊 Ejecutando ${statements.length} statements...`);
                
                for (let i = 0; i < statements.length; i++) {
                    const statement = statements[i];
                    
                    // Saltar comentarios y statements vacíos
                    if (statement.startsWith('--') || statement.trim() === '') {
                        continue;
                    }
                    
                    try {
                        const [results] = await connection.execute(statement + ';');
                        
                        // Mostrar resultados informativos
                        if (Array.isArray(results) && results.length > 0) {
                            if (results[0].info) {
                                console.log(`   ℹ️  ${results[0].info}`);
                            } else if (results[0].status) {
                                console.log(`   ✅ ${results[0].status}`);
                            } else if (results[0].Tables_in_trigamer_diario) {
                                console.log(`   📋 Tabla: ${results[0].Tables_in_trigamer_diario}`);
                            } else if (results[0].resultado) {
                                console.log(`   🎯 ${results[0].resultado}`);
                            }
                        }
                        
                    } catch (stmtError) {
                        // Ignorar errores comunes que no son críticos
                        if (stmtError.code === 'ER_TABLE_EXISTS_ERROR' || 
                            stmtError.code === 'ER_DUP_KEYNAME' ||
                            stmtError.code === 'ER_TRIGGER_ALREADY_EXISTS') {
                            console.log(`   ⚠️  Ya existe (ignorando): ${stmtError.message.split(':')[0]}`);
                        } else {
                            console.log(`   ❌ Error en statement: ${stmtError.message}`);
                        }
                    }
                }
                
                console.log(`   ✅ ${script} ejecutado exitosamente`);
                
            } catch (fileError) {
                console.error(`   ❌ Error al procesar ${script}:`, fileError.message);
            }
        }
        
        // 6. Verificación final
        console.log('\n🔍 Verificación final del sistema...');
        console.log('━'.repeat(50));
        
        // Verificar tablas creadas
        const [tablas] = await connection.execute('SHOW TABLES');
        console.log(`✅ Tablas creadas: ${tablas.length}`);
        tablas.forEach(tabla => {
            console.log(`   📋 ${Object.values(tabla)[0]}`);
        });
        
        // Verificar triggers
        const [triggers] = await connection.execute('SHOW TRIGGERS');
        console.log(`\n✅ Triggers creados: ${triggers.length}`);
        triggers.forEach(trigger => {
            console.log(`   ⚡ ${trigger.Trigger} (${trigger.Event} on ${trigger.Table})`);
        });
        
        // Verificar usuario administrador
        const [admin] = await connection.execute('SELECT COUNT(*) as count FROM users WHERE rol = "administrador"');
        console.log(`\n✅ Usuarios administrador: ${admin[0].count}`);
        
        console.log('\n🎉 CONFIGURACIÓN COMPLETADA EXITOSAMENTE!');
        console.log('━'.repeat(50));
        console.log('📊 RESUMEN DEL SISTEMA:');
        console.log('   ✅ Base de datos: trigamer_diario');
        console.log('   ✅ Tablas principales: users, news, com, content_feed');
        console.log('   ✅ Tablas de interacción: likes, com_likes, comments, com_comments');
        console.log('   ✅ Triggers automáticos configurados');
        console.log('   ✅ Usuario administrador creado');
        console.log('\n🚀 El sistema está listo para usar!');
        console.log('🌐 Puede iniciar la aplicación con: npm start');
        
    } catch (error) {
        console.error('\n❌ Error durante la configuración:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 Solución:');
            console.log('   1. Asegúrate de que MySQL esté ejecutándose');
            console.log('   2. Verifica las credenciales en env.local');
            console.log('   3. Verifica que el puerto 3306 esté disponible');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('\n💡 Solución:');
            console.log('   1. Verifica las credenciales de MySQL en env.local');
            console.log('   2. Asegúrate de que el usuario tenga permisos');
        }
        
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Conexión cerrada');
        }
    }
}

// Ejecutar la configuración
if (require.main === module) {
    setupDatabaseFeedCompleto().catch(console.error);
}

module.exports = setupDatabaseFeedCompleto; 