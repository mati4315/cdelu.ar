const mysql = require('mysql2/promise');

async function checkUserTickets() {
    try {
        // Configuración de la base de datos
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'trigamer_diario'
        });

        console.log('🔍 Verificando tickets del usuario test@trigamer.net...\n');

        // Obtener ID del usuario
        const [users] = await connection.execute(`
            SELECT id, nombre, email FROM users WHERE email = 'test@trigamer.net'
        `);

        if (users.length === 0) {
            console.log('❌ Usuario no encontrado');
            return;
        }

        const userId = users[0].id;
        console.log(`👤 Usuario: ${users[0].nombre} (ID: ${userId})`);

        // Obtener todos los tickets del usuario
        const [tickets] = await connection.execute(`
            SELECT lt.*, l.title as lottery_title
            FROM lottery_tickets lt
            JOIN lotteries l ON lt.lottery_id = l.id
            WHERE lt.user_id = ?
            ORDER BY lt.lottery_id, lt.ticket_number
        `, [userId]);

        console.log(`📊 Total de tickets: ${tickets.length}\n`);

        // Agrupar por lotería
        const ticketsByLottery = {};
        tickets.forEach(ticket => {
            if (!ticketsByLottery[ticket.lottery_id]) {
                ticketsByLottery[ticket.lottery_id] = [];
            }
            ticketsByLottery[ticket.lottery_id].push(ticket);
        });

        Object.entries(ticketsByLottery).forEach(([lotteryId, lotteryTickets]) => {
            console.log(`🎯 Lotería ${lotteryId}: ${lotteryTickets[0].lottery_title}`);
            console.log(`   Tickets: ${lotteryTickets.length}`);
            
            lotteryTickets.forEach(ticket => {
                console.log(`     🎫 #${ticket.ticket_number} - ${ticket.payment_status} - $${ticket.payment_amount}`);
            });
            console.log('---');
        });

        // Verificar específicamente la lotería 28
        const [lottery28Tickets] = await connection.execute(`
            SELECT COUNT(*) as count FROM lottery_tickets 
            WHERE user_id = ? AND lottery_id = 28
        `, [userId]);

        console.log(`🎯 Tickets en lotería 28: ${lottery28Tickets[0].count}`);

        await connection.end();
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkUserTickets(); 