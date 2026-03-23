const mysql = require('mysql2/promise');

async function checkDatabases() {
    try {
        // Conectar sin especificar base de datos
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: ''
        });

        console.log('🔍 Verificando bases de datos disponibles...\n');

        // Obtener todas las bases de datos
        const [databases] = await connection.execute('SHOW DATABASES');
        
        console.log('📊 Bases de datos encontradas:');
        databases.forEach(db => {
            console.log(`   - ${db.Database}`);
        });

        // Verificar si existe la base de datos del proyecto
        const projectDbs = databases.filter(db => 
            db.Database.includes('cdelu') || 
            db.Database.includes('trigamer') || 
            db.Database.includes('lottery')
        );

        if (projectDbs.length > 0) {
            console.log('\n🎯 Bases de datos del proyecto:');
            projectDbs.forEach(db => {
                console.log(`   - ${db.Database}`);
            });
        } else {
            console.log('\n❌ No se encontraron bases de datos del proyecto');
        }

        await connection.end();
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkDatabases(); 