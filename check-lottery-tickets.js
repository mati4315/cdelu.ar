const mysql = require('mysql2/promise');

async function checkLotteryTickets() {
    try {
        // Configuración de la base de datos
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'trigamer_diario'
        });

        console.log('🔍 Verificando tickets de la lotería 28 (333333)...\n');

        // Obtener información de la lotería
        const [lotteries] = await connection.execute(`
            SELECT * FROM lotteries WHERE id = 28
        `);

        if (lotteries.length === 0) {
            console.log('❌ Lotería 28 no encontrada');
            return;
        }

        const lottery = lotteries[0];
        console.log(`🎯 Lotería: ${lottery.title}`);
        console.log(`💰 Es gratis: ${lottery.is_free}`);
        console.log(`🎫 Precio: $${lottery.ticket_price}`);
        console.log(`📅 Fecha fin: ${lottery.end_date}`);
        console.log('---');

        // Obtener todos los tickets de esta lotería
        const [tickets] = await connection.execute(`
            SELECT lt.*, u.nombre as user_name, u.email as user_email
            FROM lottery_tickets lt
            LEFT JOIN users u ON lt.user_id = u.id
            WHERE lt.lottery_id = 28
            ORDER BY lt.ticket_number
        `);

        console.log(`📊 Total de tickets: ${tickets.length}\n`);

        tickets.forEach(ticket => {
            console.log(`🎫 Ticket #${ticket.ticket_number}`);
            console.log(`   Usuario: ${ticket.user_name} (${ticket.user_email})`);
            console.log(`   Estado: ${ticket.payment_status}`);
            console.log(`   Monto: $${ticket.payment_amount}`);
            console.log(`   Método: ${ticket.payment_method || 'N/A'}`);
            console.log(`   Creado: ${ticket.created_at}`);
            console.log(`   Ganador: ${ticket.is_winner ? 'Sí' : 'No'}`);
            console.log('---');
        });

        // Contar por estado
        const statusCounts = {};
        tickets.forEach(ticket => {
            statusCounts[ticket.payment_status] = (statusCounts[ticket.payment_status] || 0) + 1;
        });

        console.log('📈 Resumen por estado:');
        Object.entries(statusCounts).forEach(([status, count]) => {
            console.log(`   ${status}: ${count}`);
        });

        await connection.end();
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkLotteryTickets(); 