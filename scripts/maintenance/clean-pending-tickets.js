const mysql = require('mysql2/promise');

async function cleanPendingTickets() {
    try {
        // Configuración de la base de datos
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'trigamer_diario'
        });

        console.log('🧹 Limpiando tickets pendientes expirados...\n');

        // Obtener tickets pendientes
        const [pendingTickets] = await connection.execute(`
            SELECT lt.*, l.title as lottery_title, l.end_date
            FROM lottery_tickets lt
            JOIN lotteries l ON lt.lottery_id = l.id
            WHERE lt.payment_status = 'pending'
            ORDER BY lt.created_at DESC
        `);

        console.log(`📊 Encontrados ${pendingTickets.length} tickets pendientes:\n`);

        pendingTickets.forEach(ticket => {
            console.log(`🎫 Ticket #${ticket.ticket_number} - Lotería: ${ticket.lottery_title}`);
            console.log(`   Usuario ID: ${ticket.user_id}`);
            console.log(`   Creado: ${ticket.created_at}`);
            console.log(`   Fecha fin lotería: ${ticket.end_date}`);
            console.log('---');
        });

        // Eliminar tickets pendientes que tienen más de 1 hora
        const [deletedTickets] = await connection.execute(`
            DELETE FROM lottery_tickets 
            WHERE payment_status = 'pending' 
            AND created_at < DATE_SUB(NOW(), INTERVAL 1 HOUR)
        `);

        console.log(`✅ Eliminados ${deletedTickets.affectedRows} tickets pendientes expirados`);

        // Verificar tickets restantes
        const [remainingPending] = await connection.execute(`
            SELECT COUNT(*) as count FROM lottery_tickets WHERE payment_status = 'pending'
        `);

        console.log(`📊 Tickets pendientes restantes: ${remainingPending[0].count}`);

        await connection.end();
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

cleanPendingTickets(); 