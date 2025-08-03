const mysql = require('mysql2/promise');

async function fixLotteryConsistency() {
    try {
        // Configuración de la base de datos
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'trigamer_diario'
        });

        console.log('🔧 Corrigiendo consistencia de la lotería 28...\n');

        // Opción 1: Hacer la lotería gratuita
        console.log('📝 Opción 1: Hacer la lotería gratuita');
        await connection.execute(`
            UPDATE lotteries 
            SET is_free = 1 
            WHERE id = 28
        `);

        // Marcar tickets pendientes como pagados
        console.log('✅ Marcando tickets pendientes como pagados...');
        const [updateResult] = await connection.execute(`
            UPDATE lottery_tickets 
            SET payment_status = 'paid', payment_method = 'free'
            WHERE lottery_id = 28 AND payment_status = 'pending'
        `);

        console.log(`✅ Actualizados ${updateResult.affectedRows} tickets`);

        // Verificar el resultado
        const [lottery] = await connection.execute(`
            SELECT * FROM lotteries WHERE id = 28
        `);

        console.log('\n📊 Estado final de la lotería:');
        console.log(`   ID: ${lottery[0].id}`);
        console.log(`   Título: ${lottery[0].title}`);
        console.log(`   Es gratis: ${lottery[0].is_free}`);
        console.log(`   Precio: $${lottery[0].ticket_price}`);

        // Verificar tickets
        const [tickets] = await connection.execute(`
            SELECT payment_status, COUNT(*) as count
            FROM lottery_tickets 
            WHERE lottery_id = 28
            GROUP BY payment_status
        `);

        console.log('\n📈 Estado de tickets:');
        tickets.forEach(ticket => {
            console.log(`   ${ticket.payment_status}: ${ticket.count}`);
        });

        await connection.end();
        
        console.log('\n✅ Corrección completada');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

fixLotteryConsistency(); 