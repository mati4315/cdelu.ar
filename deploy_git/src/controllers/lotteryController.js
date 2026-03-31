const pool = require('../config/database');
const { authenticate, authorize } = require('../middlewares/auth');

/**
 * Controlador para gestión de loterías
 * Soporta loterías gratuitas y de pago
 */
class LotteryController {
  
  /**
   * Obtener todas las loterías con filtros opcionales
   */
  async getLotteries(request, reply) {
    try {
      const { 
        status, 
        is_free, 
        page = 1, 
        limit = 10,
        user_id 
      } = request.query;
      
      let whereConditions = [];
      let params = [];
      
      // Filtros opcionales
      if (status) {
        whereConditions.push('l.status = ?');
        params.push(status);
      }
      
      if (is_free !== undefined) {
        whereConditions.push('l.is_free = ?');
        params.push(is_free === 'true' ? 1 : 0);
      }
      
      // Si se especifica user_id, mostrar solo loterías donde el usuario participa
      if (user_id) {
        whereConditions.push('EXISTS (SELECT 1 FROM lottery_tickets lt WHERE lt.lottery_id = l.id AND lt.user_id = ?)');
        params.push(user_id);
      }
      
      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
      
      // Consulta principal con estadísticas
      const query = `
        SELECT 
          l.*,
          u.nombre as created_by_name,
          COUNT(DISTINCT lt.id) as tickets_sold,
          COUNT(DISTINCT lw.id) as winners_selected,
          CASE 
            WHEN l.status = 'active' AND NOW() > l.end_date THEN 'overdue'
            WHEN l.status = 'active' AND NOW() BETWEEN l.start_date AND l.end_date THEN 'running'
            WHEN l.status = 'active' AND NOW() < l.start_date THEN 'pending'
            ELSE l.status
          END as current_status
        FROM lotteries l
        LEFT JOIN users u ON l.created_by = u.id
        LEFT JOIN lottery_tickets lt ON l.id = lt.lottery_id AND lt.payment_status = 'paid'
        LEFT JOIN lottery_winners lw ON l.id = lw.lottery_id
        ${whereClause}
        GROUP BY l.id
        ORDER BY l.created_at DESC
        LIMIT ? OFFSET ?
      `;
      
      const offset = (page - 1) * limit;
      params.push(parseInt(limit), offset);
      
      const [lotteries] = await pool.execute(query, params);
      
      // Contar total para paginación
      const countQuery = `
        SELECT COUNT(DISTINCT l.id) as total
        FROM lotteries l
        ${whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : ''}
      `;
      
      const [countResult] = await pool.execute(countQuery, whereConditions.length > 0 ? params.slice(0, -2) : []);
      const total = countResult[0].total;
      
      return reply.send({
        success: true,
        data: lotteries,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
      
    } catch (error) {
      console.error('Error al obtener loterías:', error);
      return reply.status(500).send({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
  
  /**
   * Obtener una lotería específica con detalles completos
   */
  async getLottery(request, reply) {
    try {
      const { id } = request.params;
      const userId = request.user?.id;
      
      // Obtener información de la lotería
      const [lotteries] = await pool.execute(`
        SELECT 
          l.*,
          u.nombre as created_by_name,
          COUNT(DISTINCT lt.id) as tickets_sold,
          COUNT(DISTINCT lw.id) as winners_selected,
          CASE 
            WHEN l.status = 'active' AND NOW() > l.end_date THEN 'overdue'
            WHEN l.status = 'active' AND NOW() BETWEEN l.start_date AND l.end_date THEN 'running'
            WHEN l.status = 'active' AND NOW() < l.start_date THEN 'pending'
            ELSE l.status
          END as current_status
        FROM lotteries l
        LEFT JOIN users u ON l.created_by = u.id
        LEFT JOIN lottery_tickets lt ON l.id = lt.lottery_id AND lt.payment_status = 'paid'
        LEFT JOIN lottery_winners lw ON l.id = lw.lottery_id
        WHERE l.id = ?
        GROUP BY l.id
      `, [id]);
      
      if (lotteries.length === 0) {
        return reply.status(404).send({
          success: false,
          message: 'Lotería no encontrada'
        });
      }
      
      const lottery = lotteries[0];
      
      // Si el usuario está autenticado, obtener sus tickets
      let userTickets = [];
      if (userId) {
        const [tickets] = await pool.execute(`
          SELECT ticket_number, purchase_date, payment_status, is_winner
          FROM lottery_tickets 
          WHERE lottery_id = ? AND user_id = ?
          ORDER BY ticket_number
        `, [id, userId]);
        userTickets = tickets;
      }
      
      // Obtener números disponibles (si la lotería está activa)
      let availableNumbers = [];
      if (lottery.status === 'active' && lottery.current_status === 'running') {
        const [soldNumbers] = await pool.execute(`
          SELECT ticket_number 
          FROM lottery_tickets 
          WHERE lottery_id = ? AND payment_status = 'paid'
        `, [id]);
        
        const soldNumbersSet = new Set(soldNumbers.map(t => t.ticket_number));
        availableNumbers = Array.from({length: lottery.max_tickets}, (_, i) => i + 1)
          .filter(num => !soldNumbersSet.has(num));
      }
      
      return reply.send({
        success: true,
        data: {
          ...lottery,
          user_tickets: userTickets,
          available_numbers: availableNumbers,
          tickets_remaining: lottery.max_tickets - lottery.tickets_sold
        }
      });
      
    } catch (error) {
      console.error('Error al obtener lotería:', error);
      return reply.status(500).send({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
  
  /**
   * Crear una nueva lotería (solo administradores)
   */
  async createLottery(request, reply) {
    try {
      // Verificar permisos de administrador
      console.log('🔍 Debug - request.user:', request.user);
      console.log('🔍 Debug - request.user.rol:', request.user?.rol);
      
      if (!request.user || request.user.rol !== 'administrador') {
        return reply.status(403).send({
          success: false,
          message: 'Acceso denegado. Solo administradores pueden crear loterías'
        });
      }
      
      const {
        title,
        description,
        image_url,
        is_free = false,
        ticket_price = 0,
        min_tickets = 1,
        max_tickets,
        num_winners = 1,
        start_date,
        end_date,
        prize_description,
        terms_conditions
      } = request.body;
      
      // Validaciones básicas
      if (!title || !max_tickets || !start_date || !end_date) {
        return reply.status(400).send({
          success: false,
          message: 'Faltan campos requeridos: title, max_tickets, start_date, end_date'
        });
      }
      
      if (new Date(start_date) >= new Date(end_date)) {
        return reply.status(400).send({
          success: false,
          message: 'La fecha de inicio debe ser anterior a la fecha de fin'
        });
      }
      
      if (max_tickets < min_tickets) {
        return reply.status(400).send({
          success: false,
          message: 'El número máximo de tickets debe ser mayor o igual al mínimo'
        });
      }
      
      if (num_winners > max_tickets) {
        return reply.status(400).send({
          success: false,
          message: 'El número de ganadores no puede ser mayor al número máximo de tickets'
        });
      }
      
      // Insertar la lotería
      const [result] = await pool.execute(`
        INSERT INTO lotteries (
          title, description, image_url, is_free, ticket_price,
          min_tickets, max_tickets, num_winners, start_date, end_date,
          prize_description, terms_conditions, created_by, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        title, 
        description || null, 
        image_url || null, 
        is_free ? 1 : 0, 
        ticket_price || 0,
        min_tickets, 
        max_tickets, 
        num_winners, 
        start_date, 
        end_date,
        prize_description || null, 
        terms_conditions || null, 
        request.user.id,
        'draft'
      ]);
      
      const lotteryId = result.insertId;
      
      // Obtener la lotería creada
      const [lotteries] = await pool.execute(`
        SELECT * FROM lotteries WHERE id = ?
      `, [lotteryId]);
      
      return reply.status(201).send({
        success: true,
        message: 'Lotería creada exitosamente',
        data: lotteries[0]
      });
      
    } catch (error) {
      console.error('Error al crear lotería:', error);
      return reply.status(500).send({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
  
  /**
   * Actualizar una lotería (solo administradores)
   */
  async updateLottery(request, reply) {
    try {
      // Verificar permisos de administrador
      if (!request.user || request.user.rol !== 'administrador') {
        return reply.status(403).send({
          success: false,
          message: 'Acceso denegado. Solo administradores pueden actualizar loterías'
        });
      }
      
      const { id } = request.params;
      const updateData = request.body;
      
      // Verificar que la lotería existe
      const [lotteries] = await pool.execute(`
        SELECT status FROM lotteries WHERE id = ?
      `, [id]);
      
      if (lotteries.length === 0) {
        return reply.status(404).send({
          success: false,
          message: 'Lotería no encontrada'
        });
      }
      
      const lottery = lotteries[0];
      
      // Permitir actualizar loterías en draft, cancelled o active
      if (!['draft', 'cancelled', 'active'].includes(lottery.status)) {
        return reply.status(400).send({
          success: false,
          message: 'Solo se pueden actualizar loterías en estado borrador, canceladas o activas'
        });
      }
      
      // Para loterías activas, verificar si hay tickets vendidos para aplicar restricciones
      let hasTicketsSold = false;
      if (lottery.status === 'active') {
        const [soldTickets] = await pool.execute(`
          SELECT COUNT(*) as count FROM lottery_tickets 
          WHERE lottery_id = ? AND payment_status = 'paid'
        `, [id]);
        hasTicketsSold = soldTickets[0].count > 0;
      }
      
      // Validar campos restringidos para loterías activas con tickets vendidos
      if (lottery.status === 'active' && hasTicketsSold) {
        const restrictedFields = ['is_free', 'ticket_price', 'max_tickets', 'min_tickets', 'num_winners'];
        const restrictedChanges = Object.keys(updateData).filter(key => restrictedFields.includes(key));
        
        if (restrictedChanges.length > 0) {
          return reply.status(400).send({
            success: false,
            message: `No se pueden modificar estos campos en loterías activas con tickets vendidos: ${restrictedChanges.join(', ')}. Solo se permiten cambios en: título, descripción, imagen, fechas, premios y términos.`,
            restricted_fields: restrictedChanges,
            allowed_fields: ['title', 'description', 'image_url', 'start_date', 'end_date', 'prize_description', 'terms_conditions']
          });
        }
      }
      
      // Construir query de actualización dinámicamente
      const allowedFields = [
        'title', 'description', 'image_url', 'is_free', 'ticket_price',
        'min_tickets', 'max_tickets', 'num_winners', 'start_date', 'end_date',
        'prize_description', 'terms_conditions', 'status'
      ];
      
      const updates = [];
      const values = [];
      
      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key)) {
          updates.push(`${key} = ?`);
          values.push(value);
        }
      }
      
      if (updates.length === 0) {
        return reply.status(400).send({
          success: false,
          message: 'No hay campos válidos para actualizar'
        });
      }
      
      values.push(id);
      
      await pool.execute(`
        UPDATE lotteries SET ${updates.join(', ')} WHERE id = ?
      `, values);
      
      // Obtener la lotería actualizada
      const [updatedLotteries] = await pool.execute(`
        SELECT * FROM lotteries WHERE id = ?
      `, [id]);
      
      return reply.send({
        success: true,
        message: 'Lotería actualizada exitosamente',
        data: updatedLotteries[0]
      });
      
    } catch (error) {
      console.error('Error al actualizar lotería:', error);
      return reply.status(500).send({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
  
  /**
   * Comprar tickets de lotería
   */
  async buyTickets(request, reply) {
    try {
      const { id: lottery_id } = request.params;
      const { ticket_numbers } = request.body;
      const userId = request.user?.id;
      
      if (!userId) {
        return reply.status(401).send({
          success: false,
          message: 'Debe iniciar sesión para comprar tickets'
        });
      }
      
      if (!ticket_numbers || !Array.isArray(ticket_numbers)) {
        return reply.status(400).send({
          success: false,
          message: 'Se requiere un array de ticket_numbers'
        });
      }
      
      // Verificar que la lotería existe y está activa
      const [lotteries] = await pool.execute(`
        SELECT * FROM lotteries WHERE id = ? AND status = 'active'
      `, [lottery_id]);
      
      if (lotteries.length === 0) {
        return reply.status(404).send({
          success: false,
          message: 'Lotería no encontrada o no está activa'
        });
      }
      
      const lottery = lotteries[0];
      const now = new Date();
      
      // Verificar que la lotería está en período de compra
      if (now < new Date(lottery.start_date) || now > new Date(lottery.end_date)) {
        return reply.status(400).send({
          success: false,
          message: 'La lotería no está en período de compra'
        });
      }
      
      // Verificar que los números están disponibles
      const [existingTickets] = await pool.execute(`
        SELECT ticket_number FROM lottery_tickets 
        WHERE lottery_id = ? AND ticket_number IN (${ticket_numbers.map(() => '?').join(',')})
        AND payment_status IN ('paid', 'pending')
      `, [lottery_id, ...ticket_numbers]);
      
      if (existingTickets.length > 0) {
        return reply.status(400).send({
          success: false,
          message: `Los siguientes números no están disponibles: ${existingTickets.map(t => t.ticket_number).join(', ')}`
        });
      }
      
      // Verificar límite de tickets por usuario
      const [userTickets] = await pool.execute(`
        SELECT COUNT(*) as count FROM lottery_tickets 
        WHERE lottery_id = ? AND user_id = ? AND payment_status IN ('paid', 'pending')
      `, [lottery_id, userId]);
      
      const maxTicketsPerUser = 10; // Configurable
      if (userTickets[0].count + ticket_numbers.length > maxTicketsPerUser) {
        return reply.status(400).send({
          success: false,
          message: `No puede comprar más de ${maxTicketsPerUser} tickets por lotería`
        });
      }
      
      // Calcular monto total
      const totalAmount = lottery.is_free ? 0 : (lottery.ticket_price * ticket_numbers.length);
      
      // Crear tickets
      const ticketInserts = ticket_numbers.map(ticketNumber => [
        lottery_id, userId, ticketNumber, 
        lottery.is_free ? 'paid' : 'pending',
        totalAmount / ticket_numbers.length,
        lottery.is_free ? 'free' : null
      ]);
      
      await pool.execute(`
        INSERT INTO lottery_tickets (
          lottery_id, user_id, ticket_number, payment_status, payment_amount, payment_method
        ) VALUES ${ticket_numbers.map(() => '(?, ?, ?, ?, ?, ?)').join(',')}
      `, ticketInserts.flat());
      
      // Si es gratuita, marcar como pagado inmediatamente
      if (lottery.is_free) {
        await pool.execute(`
          UPDATE lottery_tickets 
          SET payment_status = 'paid' 
          WHERE lottery_id = ? AND user_id = ? AND ticket_number IN (${ticket_numbers.map(() => '?').join(',')})
        `, [lottery_id, userId, ...ticket_numbers]);
      }
      
      return reply.send({
        success: true,
        message: lottery.is_free ? 'Tickets reservados exitosamente' : 'Tickets creados. Complete el pago para confirmar.',
        data: {
          lottery_id,
          ticket_numbers,
          total_amount: totalAmount,
          is_free: lottery.is_free,
          payment_required: !lottery.is_free
        }
      });
      
    } catch (error) {
      console.error('Error al comprar tickets:', error);
      return reply.status(500).send({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
  
  /**
   * Obtener tickets de un usuario para una lotería
   */
  async getUserTickets(request, reply) {
    try {
      const { id: lottery_id } = request.params;
      const userId = request.user?.id;
      
      if (!userId) {
        return reply.status(401).send({
          success: false,
          message: 'Debe iniciar sesión para ver sus tickets'
        });
      }
      
      const [tickets] = await pool.execute(`
        SELECT 
          lt.*,
          l.title as lottery_title,
          l.is_free,
          l.ticket_price
        FROM lottery_tickets lt
        JOIN lotteries l ON lt.lottery_id = l.id
        WHERE lt.lottery_id = ? AND lt.user_id = ?
        ORDER BY lt.ticket_number
      `, [lottery_id, userId]);
      
      return reply.send({
        success: true,
        data: tickets
      });
      
    } catch (error) {
      console.error('Error al obtener tickets del usuario:', error);
      return reply.status(500).send({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
  
  /**
   * Finalizar lotería y seleccionar ganadores (solo administradores)
   */
  async finishLottery(request, reply) {
    try {
      // Verificar permisos de administrador
      if (!request.user || request.user.rol !== 'administrador') {
        return reply.status(403).send({
          success: false,
          message: 'Acceso denegado. Solo administradores pueden finalizar loterías'
        });
      }
      
      const { id } = request.params;
      
      // Verificar que la lotería existe y está activa
      const [lotteries] = await pool.execute(`
        SELECT * FROM lotteries WHERE id = ? AND status = 'active'
      `, [id]);
      
      if (lotteries.length === 0) {
        return reply.status(404).send({
          success: false,
          message: 'Lotería no encontrada o no está activa'
        });
      }
      
      const lottery = lotteries[0];
      
      // Verificar que la lotería ha terminado o permitir forzar finalización
      const now = new Date();
      const endDate = new Date(lottery.end_date);
      const forceFinish = request.body?.force === true;
      
      if (now < endDate && !forceFinish) {
        const timeLeft = Math.ceil((endDate - now) / (1000 * 60)); // minutos restantes
        return reply.status(400).send({
          success: false,
          message: `La lotería aún no ha terminado. Faltan ${timeLeft} minutos. Use force=true para forzar finalización.`,
          data: {
            current_time: now.toISOString(),
            end_time: endDate.toISOString(),
            minutes_left: timeLeft
          }
        });
      }
      
      // Obtener todos los tickets pagados
      const [allTickets] = await pool.execute(`
        SELECT * FROM lottery_tickets 
        WHERE lottery_id = ? AND payment_status = 'paid'
        ORDER BY ticket_number ASC
      `, [id]);
      
      if (allTickets.length < lottery.min_tickets) {
        // Lotería fallida - no alcanzó el mínimo
        await pool.execute(`
          UPDATE lotteries SET status = 'cancelled' WHERE id = ?
        `, [id]);
        
        return reply.send({
          success: true,
          message: 'Lotería cancelada por no alcanzar el mínimo de participantes',
          data: { status: 'cancelled', reason: 'insufficient_participants' }
        });
      }
      
      // Determinar método de selección de ganadores
      const { winner_selection_method = 'random', winning_numbers = [] } = request.body;
      let winners = [];
      
      if (winner_selection_method === 'manual' && winning_numbers.length > 0) {
        // Selección manual de ganadores
        console.log('Selección manual de ganadores:', winning_numbers);
        
        // Validar que no se excedan los ganadores permitidos
        if (winning_numbers.length > lottery.num_winners) {
          return reply.status(400).send({
            success: false,
            message: `Solo se pueden seleccionar ${lottery.num_winners} ganador(es). Recibidos: ${winning_numbers.length}`
          });
        }
        
        // Validar que todos los números existan y estén pagados
        const invalidNumbers = [];
        for (const ticketNumber of winning_numbers) {
          const ticket = allTickets.find(t => t.ticket_number === ticketNumber);
          if (!ticket) {
            invalidNumbers.push(ticketNumber);
          } else {
            winners.push(ticket);
          }
        }
        
        if (invalidNumbers.length > 0) {
          return reply.status(400).send({
            success: false,
            message: `Los siguientes números no existen o no están pagados: ${invalidNumbers.join(', ')}`,
            data: { invalid_numbers: invalidNumbers }
          });
        }
        
        // Validar que no haya duplicados
        const uniqueNumbers = [...new Set(winning_numbers)];
        if (uniqueNumbers.length !== winning_numbers.length) {
          return reply.status(400).send({
            success: false,
            message: 'No se pueden seleccionar números duplicados'
          });
        }
        
      } else {
        // Selección aleatoria (método por defecto)
        console.log('Selección aleatoria de ganadores');
        const shuffledTickets = [...allTickets].sort(() => Math.random() - 0.5);
        winners = shuffledTickets.slice(0, lottery.num_winners);
      }
      
      // Marcar tickets como ganadores
      for (const winner of winners) {
        await pool.execute(`
          UPDATE lottery_tickets SET is_winner = 1 WHERE id = ?
        `, [winner.id]);
        
        // Registrar en tabla de ganadores
        await pool.execute(`
          INSERT INTO lottery_winners (
            lottery_id, ticket_id, user_id, ticket_number, prize_description
          ) VALUES (?, ?, ?, ?, ?)
        `, [id, winner.id, winner.user_id, winner.ticket_number, lottery.prize_description]);
      }
      
      // Actualizar estado de la lotería
      await pool.execute(`
        UPDATE lotteries 
        SET status = 'finished', winner_selected_at = NOW() 
        WHERE id = ?
      `, [id]);
      
      return reply.send({
        success: true,
        message: `Lotería finalizada exitosamente${winner_selection_method === 'manual' ? ' con ganadores seleccionados manualmente' : ' con ganadores seleccionados al azar'}`,
        data: {
          status: 'finished',
          winners_count: winners.length,
          selection_method: winner_selection_method,
          winners: winners.map(w => ({
            ticket_number: w.ticket_number,
            user_id: w.user_id
          }))
        }
      });
      
    } catch (error) {
      console.error('Error al finalizar lotería:', error);
      return reply.status(500).send({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
  
  /**
   * Obtener ganadores de una lotería
   */
  async getWinners(request, reply) {
    try {
      const { id } = request.params;
      
      const [winners] = await pool.execute(`
        SELECT 
          lw.*,
          u.nombre as username,
          u.email,
          l.title as lottery_title,
          l.prize_description
        FROM lottery_winners lw
        JOIN lottery_tickets lt ON lw.ticket_id = lt.id
        JOIN users u ON lw.user_id = u.id
        JOIN lotteries l ON lw.lottery_id = l.id
        WHERE lw.lottery_id = ?
        ORDER BY lw.created_at
      `, [id]);
      
      return reply.send({
        success: true,
        data: winners
      });
      
    } catch (error) {
      console.error('Error al obtener ganadores:', error);
      return reply.status(500).send({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
  
  /**
   * Limpiar reservas expiradas (cron job)
   */
  async cleanExpiredReservations() {
    try {
      await pool.execute(`
        DELETE FROM lottery_reserved_numbers 
        WHERE expires_at < NOW()
      `);
      
      console.log('Reservas expiradas limpiadas');
    } catch (error) {
      console.error('Error al limpiar reservas expiradas:', error);
    }
  }

  /**
   * Obtener tickets vendidos de una lotería
   * GET /api/v1/lotteries/:id/sold-tickets
   */
  async getSoldTickets(request, reply) {
    try {
      const { id } = request.params;
      
      // Verificar que la lotería existe
      const [lotteries] = await pool.execute(`
        SELECT id FROM lotteries WHERE id = ?
      `, [id]);
      
      if (lotteries.length === 0) {
        return reply.status(404).send({
          success: false,
          message: 'Lotería no encontrada'
        });
      }
      
      // Obtener todos los tickets vendidos
      const [soldTickets] = await pool.execute(`
        SELECT ticket_number 
        FROM lottery_tickets 
        WHERE lottery_id = ? 
        AND payment_status = 'paid'
        ORDER BY ticket_number ASC
      `, [id]);
      
      const ticketNumbers = soldTickets.map(ticket => ticket.ticket_number);
      
      return reply.send({
        success: true,
        data: {
          ticket_numbers: ticketNumbers,
          count: ticketNumbers.length
        }
      });
      
    } catch (error) {
      console.error('Error al obtener tickets vendidos:', error);
      return reply.status(500).send({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtener tickets del usuario para una lotería específica
   * GET /api/v1/lotteries/:id/my-tickets
   */
  async getMyTickets(request, reply) {
    try {
      const { id } = request.params;
      const userId = request.user?.id;
      
      if (!userId) {
        return reply.status(401).send({
          success: false,
          message: 'Debe iniciar sesión'
        });
      }
      
      // Verificar que la lotería existe
      const [lotteries] = await pool.execute(`
        SELECT id FROM lotteries WHERE id = ?
      `, [id]);
      
      if (lotteries.length === 0) {
        return reply.status(404).send({
          success: false,
          message: 'Lotería no encontrada'
        });
      }
      
      // Obtener tickets del usuario para esta lotería
      const [tickets] = await pool.execute(`
        SELECT 
          id,
          lottery_id,
          user_id,
          ticket_number,
          payment_status,
          payment_amount,
          payment_method,
          transaction_id,
          is_winner,
          purchase_date,
          created_at
        FROM lottery_tickets 
        WHERE lottery_id = ? AND user_id = ?
        ORDER BY ticket_number ASC
      `, [id, userId]);
      
      return reply.send({
        success: true,
        data: tickets,
        count: tickets.length
      });
      
    } catch (error) {
      console.error('Error al obtener tickets del usuario:', error);
      return reply.status(500).send({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtener estadísticas de una lotería
   * GET /api/v1/lotteries/:id/stats
   */
  async getLotteryStats(request, reply) {
    try {
      const { id } = request.params;
      
      // Verificar que la lotería existe
      const [lotteries] = await pool.execute(`
        SELECT id, max_tickets FROM lotteries WHERE id = ?
      `, [id]);
      
      if (lotteries.length === 0) {
        return reply.status(404).send({
          success: false,
          message: 'Lotería no encontrada'
        });
      }
      
      const lottery = lotteries[0];
      
      // Obtener estadísticas
      const [stats] = await pool.execute(`
        SELECT 
          COUNT(*) as total_tickets_sold,
          COUNT(DISTINCT user_id) as unique_participants,
          SUM(payment_amount) as total_revenue
        FROM lottery_tickets 
        WHERE lottery_id = ? AND payment_status = 'paid'
      `, [id]);
      
      const lotteryStats = stats[0];
      const availableTickets = lottery.max_tickets - lotteryStats.total_tickets_sold;
      
      return reply.send({
        success: true,
        data: {
          total_tickets_sold: lotteryStats.total_tickets_sold || 0,
          unique_participants: lotteryStats.unique_participants || 0,
          max_tickets: lottery.max_tickets,
          available_tickets: availableTickets,
          total_revenue: lotteryStats.total_revenue || 0,
          participation_rate: lottery.max_tickets > 0 
            ? ((lotteryStats.total_tickets_sold || 0) / lottery.max_tickets * 100).toFixed(2)
            : 0
        }
      });
      
    } catch (error) {
      console.error('Error al obtener estadísticas de lotería:', error);
      return reply.status(500).send({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Cancelar una lotería
   * PUT /api/v1/lotteries/:id/cancel
   */
  async cancelLottery(request, reply) {
    try {
      const { id } = request.params;
      const userId = request.user?.id;
      
      if (!userId) {
        return reply.status(401).send({
          success: false,
          message: 'Debe iniciar sesión'
        });
      }
      
      // Verificar que la lotería existe y está en un estado que puede ser cancelada
      const [lotteries] = await pool.execute(`
        SELECT * FROM lotteries 
        WHERE id = ? AND status IN ('draft', 'active')
      `, [id]);
      
      if (lotteries.length === 0) {
        return reply.status(404).send({
          success: false,
          message: 'Lotería no encontrada o no puede ser cancelada'
        });
      }
      
      const lottery = lotteries[0];
      
      // Verificar permisos (solo el creador o admin puede cancelar)
      if (lottery.created_by !== userId && request.user.rol !== 'administrador') {
        return reply.status(403).send({
          success: false,
          message: 'No tiene permisos para cancelar esta lotería'
        });
      }
      
      // Obtener todos los tickets vendidos para procesar reembolsos
      const [soldTickets] = await pool.execute(`
        SELECT * FROM lottery_tickets 
        WHERE lottery_id = ? AND payment_status = 'paid'
      `, [id]);
      
      // Actualizar estado de la lotería
      await pool.execute(`
        UPDATE lotteries 
        SET status = 'cancelled', updated_at = NOW() 
        WHERE id = ?
      `, [id]);
      
      // Procesar reembolsos para tickets pagados (cambiar a 'refunded')
      if (soldTickets.length > 0) {
        await pool.execute(`
          UPDATE lottery_tickets 
          SET payment_status = 'refunded', updated_at = NOW()
          WHERE lottery_id = ? AND payment_status = 'paid'
        `, [id]);
      }
      
      // Limpiar reservas pendientes
      await pool.execute(`
        DELETE FROM lottery_reserved_numbers 
        WHERE lottery_id = ?
      `, [id]);
      
      return reply.send({
        success: true,
        message: `Lotería cancelada exitosamente. Se procesaron ${soldTickets.length} reembolsos.`,
        data: {
          id: parseInt(id),
          status: 'cancelled',
          refunded_tickets: soldTickets.length
        }
      });
      
    } catch (error) {
      console.error('Error al cancelar lotería:', error);
      return reply.status(500).send({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Eliminar una lotería
   * DELETE /api/v1/lotteries/:id
   */
  async deleteLottery(request, reply) {
    try {
      const { id } = request.params;
      const userId = request.user?.id;
      
      if (!userId) {
        return reply.status(401).send({
          success: false,
          message: 'Debe iniciar sesión'
        });
      }
      
      // Verificar que la lotería existe
      const [lotteries] = await pool.execute(`
        SELECT * FROM lotteries WHERE id = ?
      `, [id]);
      
      if (lotteries.length === 0) {
        return reply.status(404).send({
          success: false,
          message: 'Lotería no encontrada'
        });
      }
      
      const lottery = lotteries[0];
      
      // Verificar permisos (solo el creador o admin puede eliminar)
      if (lottery.created_by !== userId && request.user.rol !== 'administrador') {
        return reply.status(403).send({
          success: false,
          message: 'No tiene permisos para eliminar esta lotería'
        });
      }
      
      // Mensaje informativo sobre el estado (pero se permite eliminar cualquier estado)
      const statusWarnings = {
        'active': 'Está activa y tiene participación',
        'finished': 'Está finalizada con ganadores',
        'overdue': 'Está vencida pero no finalizada'
      };
      
      const statusWarning = statusWarnings[lottery.status] || null;
      
      // Contar tickets vendidos para informar en la respuesta
      const [soldTickets] = await pool.execute(`
        SELECT COUNT(*) as count FROM lottery_tickets 
        WHERE lottery_id = ? AND payment_status = 'paid'
      `, [id]);
      
      const soldTicketsCount = soldTickets[0].count;
      
      // Eliminar todos los datos relacionados en orden correcto
      await pool.execute('DELETE FROM lottery_reserved_numbers WHERE lottery_id = ?', [id]);
      await pool.execute('DELETE FROM lottery_tickets WHERE lottery_id = ?', [id]);
      await pool.execute('DELETE FROM lottery_winners WHERE lottery_id = ?', [id]);
      
      // Eliminar la lotería
      await pool.execute('DELETE FROM lotteries WHERE id = ?', [id]);
      
      // Log de auditoría para eliminaciones con tickets vendidos
      if (soldTicketsCount > 0) {
        console.log(`🗑️ AUDITORÍA: Lotería ID ${id} "${lottery.title}" eliminada con ${soldTicketsCount} tickets vendidos por usuario ID ${userId}`);
      }
      
      let message = 'Lotería eliminada exitosamente';
      
      if (soldTicketsCount > 0) {
        message += `. Se eliminaron ${soldTicketsCount} tickets vendidos`;
      }
      
      if (statusWarning) {
        message += `. Nota: ${statusWarning}`;
      }
      
              return reply.send({
          success: true,
          message: message,
          data: {
            id: parseInt(id),
            title: lottery.title,
            status: lottery.status,
            deleted_tickets: soldTicketsCount || 0,
            status_warning: statusWarning,
            warning: soldTicketsCount > 0 ? 'Se eliminaron tickets vendidos' : null
          }
        });
      
    } catch (error) {
      console.error('Error al eliminar lotería:', error);
      return reply.status(500).send({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
}

module.exports = new LotteryController(); 