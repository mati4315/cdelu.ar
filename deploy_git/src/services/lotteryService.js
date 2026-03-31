const pool = require('../config/database');

/**
 * Servicio para lógica de negocio de loterías
 * Maneja operaciones complejas y validaciones
 */
class LotteryService {
  
  /**
   * Validar si una lotería puede ser creada
   */
  async validateLotteryCreation(lotteryData) {
    const errors = [];
    
    // Validar fechas
    if (new Date(lotteryData.start_date) >= new Date(lotteryData.end_date)) {
      errors.push('La fecha de inicio debe ser anterior a la fecha de fin');
    }
    
    // Validar números de tickets
    if (lotteryData.max_tickets < lotteryData.min_tickets) {
      errors.push('El número máximo de tickets debe ser mayor o igual al mínimo');
    }
    
    if (lotteryData.num_winners > lotteryData.max_tickets) {
      errors.push('El número de ganadores no puede ser mayor al número máximo de tickets');
    }
    
    // Validar precios
    if (!lotteryData.is_free && lotteryData.ticket_price <= 0) {
      errors.push('El precio del ticket debe ser mayor a 0 para loterías de pago');
    }
    
    if (lotteryData.is_free && lotteryData.ticket_price > 0) {
      errors.push('Las loterías gratuitas deben tener precio 0');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Verificar si una lotería puede ser activada
   */
  async canActivateLottery(lotteryId) {
    try {
      const [lotteries] = await pool.execute(`
        SELECT * FROM lotteries WHERE id = ?
      `, [lotteryId]);
      
      if (lotteries.length === 0) {
        return { canActivate: false, reason: 'Lotería no encontrada' };
      }
      
      const lottery = lotteries[0];
      
      if (lottery.status !== 'draft') {
        return { canActivate: false, reason: 'Solo se pueden activar loterías en estado draft' };
      }
      
      if (new Date(lottery.start_date) <= new Date()) {
        return { canActivate: false, reason: 'La fecha de inicio debe ser futura' };
      }
      
      return { canActivate: true };
      
    } catch (error) {
      console.error('Error al verificar activación:', error);
      return { canActivate: false, reason: 'Error interno del servidor' };
    }
  }
  
  /**
   * Verificar si una lotería puede ser finalizada
   */
  async canFinishLottery(lotteryId) {
    try {
      const [lotteries] = await pool.execute(`
        SELECT * FROM lotteries WHERE id = ? AND status = 'active'
      `, [lotteryId]);
      
      if (lotteries.length === 0) {
        return { canFinish: false, reason: 'Lotería no encontrada o no está activa' };
      }
      
      const lottery = lotteries[0];
      
      if (new Date() < new Date(lottery.end_date)) {
        return { canFinish: false, reason: 'La lotería aún no ha terminado' };
      }
      
      // Verificar si ya tiene ganadores
      const [winners] = await pool.execute(`
        SELECT COUNT(*) as count FROM lottery_winners WHERE lottery_id = ?
      `, [lotteryId]);
      
      if (winners[0].count > 0) {
        return { canFinish: false, reason: 'La lotería ya tiene ganadores seleccionados' };
      }
      
      return { canFinish: true };
      
    } catch (error) {
      console.error('Error al verificar finalización:', error);
      return { canFinish: false, reason: 'Error interno del servidor' };
    }
  }
  
  /**
   * Seleccionar ganadores aleatoriamente
   */
  async selectWinners(lotteryId) {
    try {
      // Obtener información de la lotería
      const [lotteries] = await pool.execute(`
        SELECT * FROM lotteries WHERE id = ?
      `, [lotteryId]);
      
      if (lotteries.length === 0) {
        throw new Error('Lotería no encontrada');
      }
      
      const lottery = lotteries[0];
      
      // Obtener todos los tickets pagados
      const [tickets] = await pool.execute(`
        SELECT * FROM lottery_tickets 
        WHERE lottery_id = ? AND payment_status = 'paid'
        ORDER BY RAND()
      `, [lotteryId]);
      
      if (tickets.length < lottery.min_tickets) {
        // Lotería fallida
        await pool.execute(`
          UPDATE lotteries SET status = 'cancelled' WHERE id = ?
        `, [lotteryId]);
        
        return {
          success: true,
          status: 'cancelled',
          reason: 'insufficient_participants',
          winners: []
        };
      }
      
      // Seleccionar ganadores
      const winners = tickets.slice(0, lottery.num_winners);
      
      // Marcar tickets como ganadores y registrar en tabla de ganadores
      for (const winner of winners) {
        await pool.execute(`
          UPDATE lottery_tickets SET is_winner = 1 WHERE id = ?
        `, [winner.id]);
        
        await pool.execute(`
          INSERT INTO lottery_winners (
            lottery_id, ticket_id, user_id, ticket_number, prize_description
          ) VALUES (?, ?, ?, ?, ?)
        `, [lotteryId, winner.id, winner.user_id, winner.ticket_number, lottery.prize_description]);
      }
      
      // Actualizar estado de la lotería
      await pool.execute(`
        UPDATE lotteries 
        SET status = 'finished', winner_selected_at = NOW() 
        WHERE id = ?
      `, [lotteryId]);
      
      return {
        success: true,
        status: 'finished',
        winners: winners.map(w => ({
          ticket_number: w.ticket_number,
          user_id: w.user_id,
          ticket_id: w.id
        }))
      };
      
    } catch (error) {
      console.error('Error al seleccionar ganadores:', error);
      throw error;
    }
  }
  
  /**
   * Verificar disponibilidad de números
   */
  async checkNumberAvailability(lotteryId, ticketNumbers) {
    try {
      // Obtener números vendidos
      const [soldTickets] = await pool.execute(`
        SELECT ticket_number FROM lottery_tickets 
        WHERE lottery_id = ? AND payment_status IN ('paid', 'pending')
      `, [lotteryId]);
      
      // Obtener números reservados
      const [reservedNumbers] = await pool.execute(`
        SELECT ticket_number FROM lottery_reserved_numbers 
        WHERE lottery_id = ? AND expires_at > NOW()
      `, [lotteryId]);
      
      const soldNumbersSet = new Set(soldTickets.map(t => t.ticket_number));
      const reservedNumbersSet = new Set(reservedNumbers.map(t => t.ticket_number));
      
      const unavailable = [];
      const available = [];
      
      for (const number of ticketNumbers) {
        if (soldNumbersSet.has(number) || reservedNumbersSet.has(number)) {
          unavailable.push(number);
        } else {
          available.push(number);
        }
      }
      
      return {
        available,
        unavailable,
        allAvailable: unavailable.length === 0
      };
      
    } catch (error) {
      console.error('Error al verificar disponibilidad:', error);
      throw error;
    }
  }
  
  /**
   * Obtener estadísticas de una lotería
   */
  async getLotteryStats(lotteryId) {
    try {
      const [lotteries] = await pool.execute(`
        SELECT * FROM lotteries WHERE id = ?
      `, [lotteryId]);
      
      if (lotteries.length === 0) {
        throw new Error('Lotería no encontrada');
      }
      
      const lottery = lotteries[0];
      
      // Estadísticas de tickets
      const [ticketStats] = await pool.execute(`
        SELECT 
          COUNT(*) as total_tickets,
          COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid_tickets,
          COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as pending_tickets,
          COUNT(CASE WHEN is_winner = 1 THEN 1 END) as winning_tickets,
          SUM(payment_amount) as total_revenue
        FROM lottery_tickets 
        WHERE lottery_id = ?
      `, [lotteryId]);
      
      // Estadísticas de participantes únicos
      const [participantStats] = await pool.execute(`
        SELECT COUNT(DISTINCT user_id) as unique_participants
        FROM lottery_tickets 
        WHERE lottery_id = ? AND payment_status = 'paid'
      `, [lotteryId]);
      
      // Estadísticas de ganadores
      const [winnerStats] = await pool.execute(`
        SELECT COUNT(*) as total_winners
        FROM lottery_winners 
        WHERE lottery_id = ?
      `, [lotteryId]);
      
      const stats = ticketStats[0];
      const participants = participantStats[0];
      const winners = winnerStats[0];
      
      return {
        lottery_id: lotteryId,
        title: lottery.title,
        status: lottery.status,
        tickets_sold: stats.paid_tickets,
        tickets_remaining: lottery.max_tickets - stats.paid_tickets,
        total_revenue: stats.total_revenue || 0,
        unique_participants: participants.unique_participants,
        total_winners: winners.total_winners,
        participation_rate: (stats.paid_tickets / lottery.max_tickets) * 100,
        completion_rate: lottery.status === 'finished' ? 100 : 
                        lottery.status === 'cancelled' ? 0 : 
                        (stats.paid_tickets / lottery.min_tickets) * 100
      };
      
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      throw error;
    }
  }
  
  /**
   * Limpiar reservas expiradas
   */
  async cleanExpiredReservations() {
    try {
      const [result] = await pool.execute(`
        DELETE FROM lottery_reserved_numbers 
        WHERE expires_at < NOW()
      `);
      
      console.log(`Reservas expiradas limpiadas: ${result.affectedRows}`);
      return result.affectedRows;
      
    } catch (error) {
      console.error('Error al limpiar reservas expiradas:', error);
      throw error;
    }
  }
  
  /**
   * Verificar loterías que deben finalizarse automáticamente
   */
  async checkOverdueLotteries() {
    try {
      // Obtener loterías activas que han pasado su fecha de fin
      const [overdueLotteries] = await pool.execute(`
        SELECT id, title FROM lotteries 
        WHERE status = 'active' AND end_date < NOW()
      `);
      
      const results = [];
      
      for (const lottery of overdueLotteries) {
        try {
          const result = await this.selectWinners(lottery.id);
          results.push({
            lottery_id: lottery.id,
            title: lottery.title,
            result
          });
        } catch (error) {
          console.error(`Error al finalizar lotería ${lottery.id}:`, error);
          results.push({
            lottery_id: lottery.id,
            title: lottery.title,
            error: error.message
          });
        }
      }
      
      return results;
      
    } catch (error) {
      console.error('Error al verificar loterías vencidas:', error);
      throw error;
    }
  }
  
  /**
   * Obtener configuración del sistema de lotería
   */
  async getLotterySettings() {
    try {
      const [settings] = await pool.execute(`
        SELECT setting_key, setting_value, description 
        FROM lottery_settings
      `);
      
      const config = {};
      for (const setting of settings) {
        config[setting.setting_key] = {
          value: setting.setting_value,
          description: setting.description
        };
      }
      
      return config;
      
    } catch (error) {
      console.error('Error al obtener configuración:', error);
      throw error;
    }
  }
  
  /**
   * Actualizar configuración del sistema
   */
  async updateLotterySettings(settings) {
    try {
      const updates = [];
      
      for (const [key, value] of Object.entries(settings)) {
        await pool.execute(`
          INSERT INTO lottery_settings (setting_key, setting_value) 
          VALUES (?, ?) 
          ON DUPLICATE KEY UPDATE setting_value = ?
        `, [key, value, value]);
        
        updates.push(key);
      }
      
      return {
        success: true,
        updated_settings: updates
      };
      
    } catch (error) {
      console.error('Error al actualizar configuración:', error);
      throw error;
    }
  }
  
  /**
   * Generar reporte de lotería
   */
  async generateLotteryReport(lotteryId) {
    try {
      const stats = await this.getLotteryStats(lotteryId);
      
      // Obtener detalles de ganadores
      const [winners] = await pool.execute(`
        SELECT 
          lw.*,
          u.username,
          u.email,
          lt.ticket_number
        FROM lottery_winners lw
        JOIN lottery_tickets lt ON lw.ticket_id = lt.id
        JOIN users u ON lw.user_id = u.id
        WHERE lw.lottery_id = ?
        ORDER BY lw.created_at
      `, [lotteryId]);
      
      // Obtener top participantes
      const [topParticipants] = await pool.execute(`
        SELECT 
          u.username,
          u.email,
          COUNT(lt.id) as tickets_bought,
          SUM(lt.payment_amount) as total_spent
        FROM lottery_tickets lt
        JOIN users u ON lt.user_id = u.id
        WHERE lt.lottery_id = ? AND lt.payment_status = 'paid'
        GROUP BY lt.user_id
        ORDER BY tickets_bought DESC
        LIMIT 10
      `, [lotteryId]);
      
      return {
        lottery_stats: stats,
        winners: winners,
        top_participants: topParticipants,
        generated_at: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Error al generar reporte:', error);
      throw error;
    }
  }
}

module.exports = new LotteryService(); 