const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
    console.log('🚀 Iniciando configuración de la base de datos...');
    
    // Configuración de conexión para XAMPP
    const connectionConfig = {
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: '', // XAMPP por defecto no tiene contraseña
        multipleStatements: true // Permite ejecutar múltiples statements
    };
    
    let connection;
    
    try {
        // Conectar sin especificar base de datos
        connection = await mysql.createConnection(connectionConfig);
        console.log('✅ Conectado a MySQL');
        
        // Leer el archivo SQL
        const sqlFile = path.join(__dirname, 'setup-database.sql');
        const sqlContent = fs.readFileSync(sqlFile, 'utf8');
        
        console.log('📝 Ejecutando script SQL...');
        
        // Ejecutar el script SQL
        const [results] = await connection.execute(sqlContent);
        
        console.log('✅ Base de datos creada exitosamente!');
        console.log('📊 Resultados:');
        
        // Mostrar estadísticas si están disponibles
        if (Array.isArray(results)) {
            results.forEach((result, index) => {
                if (result && result.length > 0) {
                    console.log(`   ${index + 1}. ${JSON.stringify(result[0])}`);
                }
            });
        }
        
        console.log('\n🎉 Configuración completada!');
        console.log('📋 Información de acceso:');
        console.log('   - Base de datos: trigamer_diario');
        console.log('   - Usuario admin: admin@cdelu.com');
        console.log('   - Contraseña: password');
        console.log('   - Usuario test: test@test.com');
        console.log('   - Contraseña: password');
        
    } catch (error) {
        console.error('❌ Error durante la configuración:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 Solución:');
            console.log('   1. Asegúrate de que XAMPP esté ejecutándose');
            console.log('   2. Inicia MySQL desde el panel de control de XAMPP');
            console.log('   3. Verifica que el puerto 3306 esté disponible');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('\n💡 Solución:');
            console.log('   1. Verifica las credenciales de MySQL');
            console.log('   2. En XAMPP, por defecto no hay contraseña para root');
            console.log('   3. Si configuraste contraseña, actualiza el script');
        }
        
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Conexión cerrada');
        }
    }
}

// Ejecutar la configuración
setupDatabase().catch(console.error); 