const lotteryController = require('../controllers/lotteryController');
const { authenticate, authorize } = require('../middlewares/auth');
const pool = require('../config/database');

/**
 * Rutas para el sistema de lotería
 * Soporta loterías gratuitas y de pago
 */

async function lotteryRoutes(fastify, options) {
  

  
  // GET /api/v1/lotteries - Obtener todas las loterías
  fastify.get('/api/v1/lotteries', {
    schema: {
      description: 'Obtener lista de loterías con filtros opcionales',
      tags: ['Loterías'],
      querystring: {
        type: 'object',
        properties: {
          status: { 
            type: 'string', 
            enum: ['draft', 'active', 'closed', 'finished', 'cancelled'],
            description: 'Filtrar por estado de la lotería'
          },
          is_free: { 
            type: 'string', 
            enum: ['true', 'false'],
            description: 'Filtrar por tipo de lotería (gratuita o de pago)'
          },
          page: { 
            type: 'integer', 
            minimum: 1,
            default: 1,
            description: 'Número de página'
          },
          limit: { 
            type: 'integer', 
            minimum: 1,
            maximum: 100,
            default: 10,
            description: 'Número de elementos por página'
          },
          user_id: { 
            type: 'integer',
            description: 'Filtrar loterías donde participa el usuario'
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  title: { type: 'string' },
                  description: { type: 'string' },
                  image_url: { type: 'string' },
                  is_free: { type: 'boolean' },
                  ticket_price: { type: 'number' },
                  min_tickets: { type: 'integer' },
                  max_tickets: { type: 'integer' },
                  num_winners: { type: 'integer' },
                  start_date: { type: 'string', format: 'date-time' },
                  end_date: { type: 'string', format: 'date-time' },
                  status: { type: 'string' },
                  current_status: { type: 'string' },
                  tickets_sold: { type: 'integer' },
                  winners_selected: { type: 'integer' },
                  created_by_name: { type: 'string' },
                  created_at: { type: 'string', format: 'date-time' }
                }
              }
            },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'integer' },
                limit: { type: 'integer' },
                total: { type: 'integer' },
                pages: { type: 'integer' }
              }
            }
          }
        }
      }
    }
  }, lotteryController.getLotteries);
  
  // GET /api/lotteries/:id - Obtener lotería específica
  fastify.get('/api/v1/lotteries/:id', {
    schema: {
      description: 'Obtener detalles de una lotería específica',
      tags: ['Loterías'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer', description: 'ID de la lotería' }
        },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                title: { type: 'string' },
                description: { type: 'string' },
                image_url: { type: 'string' },
                is_free: { type: 'boolean' },
                ticket_price: { type: 'number' },
                min_tickets: { type: 'integer' },
                max_tickets: { type: 'integer' },
                num_winners: { type: 'integer' },
                start_date: { type: 'string', format: 'date-time' },
                end_date: { type: 'string', format: 'date-time' },
                status: { type: 'string' },
                current_status: { type: 'string' },
                tickets_sold: { type: 'integer' },
                tickets_remaining: { type: 'integer' },
                available_numbers: { type: 'array', items: { type: 'integer' } },
                user_tickets: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      ticket_number: { type: 'integer' },
                      purchase_date: { type: 'string', format: 'date-time' },
                      payment_status: { type: 'string' },
                      is_winner: { type: 'boolean' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }, lotteryController.getLottery);
  
  // POST /api/lotteries - Crear nueva lotería (solo administradores)
  fastify.post('/api/v1/lotteries', {
    preHandler: async (request, reply) => {
      await authenticate(request, reply);
      await authorize(request, reply, ['administrador']);
    },
    schema: {
      description: 'Crear una nueva lotería (solo administradores)',
      tags: ['Loterías - Administración'],
      body: {
        type: 'object',
        required: ['title', 'max_tickets', 'start_date', 'end_date'],
        properties: {
          title: { 
            type: 'string', 
            minLength: 1,
            maxLength: 255,
            description: 'Título de la lotería'
          },
          description: { 
            type: 'string',
            description: 'Descripción detallada de la lotería'
          },
          image_url: { 
            type: 'string',
            format: 'uri',
            description: 'URL de la imagen de la lotería'
          },
          is_free: { 
            type: 'boolean',
            default: false,
            description: 'Si la lotería es gratuita'
          },
          ticket_price: { 
            type: 'number',
            minimum: 0,
            default: 0,
            description: 'Precio por ticket (0 para gratuitas)'
          },
          min_tickets: { 
            type: 'integer',
            minimum: 1,
            default: 1,
            description: 'Número mínimo de tickets para iniciar'
          },
          max_tickets: { 
            type: 'integer',
            minimum: 1,
            description: 'Número máximo de tickets disponibles'
          },
          num_winners: { 
            type: 'integer',
            minimum: 1,
            default: 1,
            description: 'Número de ganadores'
          },
          start_date: { 
            type: 'string',
            format: 'date-time',
            description: 'Fecha y hora de inicio'
          },
          end_date: { 
            type: 'string',
            format: 'date-time',
            description: 'Fecha y hora de finalización'
          },
          prize_description: { 
            type: 'string',
            description: 'Descripción del premio'
          },
          terms_conditions: { 
            type: 'string',
            description: 'Términos y condiciones'
          }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                title: { type: 'string' },
                status: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, lotteryController.createLottery);
  
  // PUT /api/lotteries/:id - Actualizar lotería (solo administradores)
  fastify.put('/api/v1/lotteries/:id', {
    preHandler: async (request, reply) => {
      await authenticate(request, reply);
      await authorize(request, reply, ['administrador']);
    },
    schema: {
      description: 'Actualizar una lotería existente (solo administradores)',
      tags: ['Loterías - Administración'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer', description: 'ID de la lotería' }
        },
        required: ['id']
      },
      body: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          image_url: { type: 'string' },
          is_free: { type: 'boolean' },
          ticket_price: { type: 'number' },
          min_tickets: { type: 'integer' },
          max_tickets: { type: 'integer' },
          num_winners: { type: 'integer' },
          start_date: { type: 'string', format: 'date-time' },
          end_date: { type: 'string', format: 'date-time' },
          prize_description: { type: 'string' },
          terms_conditions: { type: 'string' },
          status: { type: 'string', enum: ['draft', 'active', 'closed', 'cancelled'] }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                title: { type: 'string' },
                status: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, lotteryController.updateLottery);
  
  // POST /api/lotteries/:id/buy - Comprar tickets
  fastify.post('/api/v1/lotteries/:id/buy', {
    preHandler: async (request, reply) => {
      await authenticate(request, reply);
    },
    schema: {
      description: 'Comprar tickets de una lotería',
      tags: ['Loterías'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer', description: 'ID de la lotería' }
        },
        required: ['id']
      },
      body: {
        type: 'object',
        required: ['ticket_numbers'],
        properties: {
          ticket_numbers: {
            type: 'array',
            items: { type: 'integer', minimum: 1 },
            minItems: 1,
            maxItems: 10,
            description: 'Array de números de tickets a comprar'
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                lottery_id: { type: 'integer' },
                ticket_numbers: { type: 'array', items: { type: 'integer' } },
                total_amount: { type: 'number' },
                is_free: { type: 'boolean' },
                payment_required: { type: 'boolean' }
              }
            }
          }
        }
      }
    }
  }, lotteryController.buyTickets);
  
  // GET /api/lotteries/:id/tickets - Obtener tickets del usuario
  fastify.get('/api/v1/lotteries/:id/tickets', {
    preHandler: async (request, reply) => {
      await authenticate(request, reply);
    },
    schema: {
      description: 'Obtener tickets del usuario para una lotería específica',
      tags: ['Loterías'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer', description: 'ID de la lotería' }
        },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  ticket_number: { type: 'integer' },
                  purchase_date: { type: 'string', format: 'date-time' },
                  payment_status: { type: 'string' },
                  payment_amount: { type: 'number' },
                  is_winner: { type: 'boolean' },
                  lottery_title: { type: 'string' },
                  is_free: { type: 'boolean' },
                  ticket_price: { type: 'number' }
                }
              }
            }
          }
        }
      }
    }
  }, lotteryController.getUserTickets);
  
  // POST /api/lotteries/:id/finish - Finalizar lotería (solo administradores)
  fastify.post('/api/v1/lotteries/:id/finish', {
    preHandler: async (request, reply) => {
      await authenticate(request, reply);
      await authorize(request, reply, ['administrador']);
    },
    schema: {
      description: 'Finalizar una lotería y seleccionar ganadores (solo administradores)',
      tags: ['Loterías - Administración'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer', description: 'ID de la lotería' }
        },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                status: { type: 'string' },
                winners_count: { type: 'integer' },
                winners: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      ticket_number: { type: 'integer' },
                      user_id: { type: 'integer' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }, lotteryController.finishLottery);
  
  // GET /api/lotteries/:id/winners - Obtener ganadores
  fastify.get('/api/v1/lotteries/:id/winners', {
    schema: {
      description: 'Obtener lista de ganadores de una lotería',
      tags: ['Loterías'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer', description: 'ID de la lotería' }
        },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  ticket_number: { type: 'integer' },
                  username: { type: 'string' },
                  email: { type: 'string' },
                  lottery_title: { type: 'string' },
                  prize_description: { type: 'string' },
                  created_at: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        }
      }
    }
  }, lotteryController.getWinners);
  
  // GET /api/lotteries/user/history - Historial de loterías del usuario
  fastify.get('/api/v1/lotteries/user/history', {
    preHandler: async (request, reply) => {
      await authenticate(request, reply);
    },
    schema: {
      description: 'Obtener historial de participación del usuario en loterías',
      tags: ['Loterías'],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 50, default: 10 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  lottery_id: { type: 'integer' },
                  lottery_title: { type: 'string' },
                  tickets_count: { type: 'integer' },
                  total_spent: { type: 'number' },
                  has_winners: { type: 'boolean' },
                  participation_date: { type: 'string', format: 'date-time' }
                }
              }
            },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'integer' },
                limit: { type: 'integer' },
                total: { type: 'integer' },
                pages: { type: 'integer' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const { page = 1, limit = 10 } = request.query;
      
      const offset = (page - 1) * limit;
      
      // Obtener historial de participación
      const [history] = await pool.execute(`
        SELECT 
          l.id as lottery_id,
          l.title as lottery_title,
          l.is_free,
          l.ticket_price,
          COUNT(lt.id) as tickets_count,
          SUM(lt.payment_amount) as total_spent,
          MAX(lt.is_winner) as has_winners,
          MIN(lt.purchase_date) as participation_date
        FROM lottery_tickets lt
        JOIN lotteries l ON lt.lottery_id = l.id
        WHERE lt.user_id = ?
        GROUP BY l.id
        ORDER BY participation_date DESC
        LIMIT ? OFFSET ?
      `, [userId, parseInt(limit), offset]);
      
      // Contar total
      const [countResult] = await pool.execute(`
        SELECT COUNT(DISTINCT l.id) as total
        FROM lottery_tickets lt
        JOIN lotteries l ON lt.lottery_id = l.id
        WHERE lt.user_id = ?
      `, [userId]);
      
      const total = countResult[0].total;
      
      return reply.send({
        success: true,
        data: history,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
      
    } catch (error) {
      console.error('Error al obtener historial:', error);
      return reply.status(500).send({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  });

  // GET /api/v1/lotteries/user/wins - Loterías ganadas por el usuario
  fastify.get('/api/v1/lotteries/user/wins', {
    preHandler: async (request, reply) => {
      await authenticate(request, reply);
    },
    schema: {
      description: 'Obtener lista de loterías ganadas por el usuario autenticado',
      tags: ['Loterías'],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  lottery_id: { type: 'integer' },
                  lottery_title: { type: 'string' },
                  lottery_image_url: { type: 'string', nullable: true },
                  winning_number: { type: 'integer' },
                  won_at: { type: 'string', format: 'date-time' },
                  prize_description: { type: 'string', nullable: true }
                }
              }
            },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'integer' },
                limit: { type: 'integer' },
                total: { type: 'integer' },
                pages: { type: 'integer' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const { page = 1, limit = 50 } = request.query;
      const take = parseInt(limit);
      const offset = (parseInt(page) - 1) * take;

      const [wins] = await pool.execute(`
        SELECT 
          lw.lottery_id,
          l.title AS lottery_title,
          l.image_url AS lottery_image_url,
          lw.ticket_number AS winning_number,
          lw.created_at AS won_at,
          l.prize_description
        FROM lottery_winners lw
        JOIN lotteries l ON lw.lottery_id = l.id
        WHERE lw.user_id = ?
        ORDER BY lw.created_at DESC
        LIMIT ? OFFSET ?
      `, [userId, take, offset]);

      const [countResult] = await pool.execute(`
        SELECT COUNT(*) AS total
        FROM lottery_winners
        WHERE user_id = ?
      `, [userId]);

      const total = countResult[0]?.total || 0;

      return reply.send({
        success: true,
        data: wins,
        pagination: {
          page: parseInt(page),
          limit: take,
          total,
          pages: Math.ceil(total / take)
        }
      });
    } catch (error) {
      console.error('Error al obtener loterías ganadas:', error);
      return reply.status(500).send({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  });
  
  // POST /api/lotteries/:id/reserve - Reservar números temporalmente
  fastify.post('/api/v1/lotteries/:id/reserve', {
    preHandler: async (request, reply) => {
      await authenticate(request, reply);
    },
    schema: {
      description: 'Reservar números de tickets temporalmente',
      tags: ['Loterías'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer', description: 'ID de la lotería' }
        },
        required: ['id']
      },
      body: {
        type: 'object',
        required: ['ticket_numbers'],
        properties: {
          ticket_numbers: {
            type: 'array',
            items: { type: 'integer', minimum: 1 },
            minItems: 1,
            maxItems: 5,
            description: 'Array de números a reservar'
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                reserved_numbers: { type: 'array', items: { type: 'integer' } },
                expires_at: { type: 'string', format: 'date-time' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const { ticket_numbers } = request.body;
      const userId = request.user.id;
      
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
      
      // Verificar que los números están disponibles
      const [existingTickets] = await pool.execute(`
        SELECT ticket_number FROM lottery_tickets 
        WHERE lottery_id = ? AND ticket_number IN (${ticket_numbers.map(() => '?').join(',')})
        AND payment_status IN ('paid', 'pending')
      `, [id, ...ticket_numbers]);
      
      if (existingTickets.length > 0) {
        return reply.status(400).send({
          success: false,
          message: `Los siguientes números no están disponibles: ${existingTickets.map(t => t.ticket_number).join(', ')}`
        });
      }
      
      // Verificar reservas existentes
      const [existingReservations] = await pool.execute(`
        SELECT ticket_number FROM lottery_reserved_numbers 
        WHERE lottery_id = ? AND ticket_number IN (${ticket_numbers.map(() => '?').join(',')})
        AND expires_at > NOW()
      `, [id, ...ticket_numbers]);
      
      if (existingReservations.length > 0) {
        return reply.status(400).send({
          success: false,
          message: `Los siguientes números están reservados: ${existingReservations.map(t => t.ticket_number).join(', ')}`
        });
      }
      
      // Limpiar reservas expiradas del usuario
      await pool.execute(`
        DELETE FROM lottery_reserved_numbers 
        WHERE user_id = ? AND expires_at < NOW()
      `, [userId]);
      
      // Crear nuevas reservas
      const reservationTimeout = 300; // 5 minutos
      const expiresAt = new Date(Date.now() + reservationTimeout * 1000);
      
      const reservationInserts = ticket_numbers.map(ticketNumber => [
        id, ticketNumber, userId, expiresAt
      ]);
      
      await pool.execute(`
        INSERT INTO lottery_reserved_numbers (
          lottery_id, ticket_number, user_id, expires_at
        ) VALUES ${ticket_numbers.map(() => '(?, ?, ?, ?)').join(',')}
      `, reservationInserts.flat());
      
      return reply.send({
        success: true,
        message: 'Números reservados exitosamente',
        data: {
          reserved_numbers: ticket_numbers,
          expires_at: expiresAt.toISOString()
        }
      });
      
    } catch (error) {
      console.error('Error al reservar números:', error);
      return reply.status(500).send({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  });

  // GET /api/v1/lotteries/:id/sold-tickets - Obtener tickets vendidos
  fastify.get('/api/v1/lotteries/:id/sold-tickets', {
    schema: {
      description: 'Obtener lista de números de tickets vendidos para una lotería',
      tags: ['Loterías'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer', description: 'ID de la lotería' }
        },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                ticket_numbers: {
                  type: 'array',
                  items: { type: 'integer' }
                },
                count: { type: 'integer' }
              }
            }
          }
        }
      }
    }
  }, lotteryController.getSoldTickets);

  // GET /api/v1/lotteries/:id/my-tickets - Obtener tickets del usuario
  fastify.get('/api/v1/lotteries/:id/my-tickets', {
    preHandler: async (request, reply) => {
      await authenticate(request, reply);
    },
    schema: {
      description: 'Obtener tickets del usuario para una lotería específica',
      tags: ['Loterías'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer', description: 'ID de la lotería' }
        },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  lottery_id: { type: 'integer' },
                  user_id: { type: 'integer' },
                  ticket_number: { type: 'integer' },
                  payment_status: { type: 'string' },
                  payment_amount: { type: 'number' },
                  payment_method: { type: 'string' },
                  transaction_id: { type: 'string' },
                  is_winner: { type: 'boolean' },
                  purchase_date: { type: 'string', format: 'date-time' },
                  created_at: { type: 'string', format: 'date-time' }
                }
              }
            },
            count: { type: 'integer' }
          }
        }
      }
    }
  }, lotteryController.getMyTickets);

  // GET /api/v1/lotteries/:id/stats - Obtener estadísticas de la lotería
  fastify.get('/api/v1/lotteries/:id/stats', {
    schema: {
      description: 'Obtener estadísticas detalladas de una lotería',
      tags: ['Loterías'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer', description: 'ID de la lotería' }
        },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                total_tickets_sold: { type: 'integer' },
                unique_participants: { type: 'integer' },
                max_tickets: { type: 'integer' },
                available_tickets: { type: 'integer' },
                total_revenue: { type: 'number' },
                participation_rate: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, lotteryController.getLotteryStats);

  // PUT /api/v1/lotteries/:id/cancel - Cancelar una lotería
  fastify.put('/api/v1/lotteries/:id/cancel', {
    preHandler: async (request, reply) => {
      await authenticate(request, reply);
    },
    schema: {
      description: 'Cancelar una lotería (solo administradores o creador)',
      tags: ['Loterías'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer', description: 'ID de la lotería' }
        },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                status: { type: 'string' },
                refunded_tickets: { type: 'integer' }
              }
            }
          }
        }
      }
    }
  }, lotteryController.cancelLottery);

  // DELETE /api/v1/lotteries/:id - Eliminar una lotería
  fastify.delete('/api/v1/lotteries/:id', {
    preHandler: async (request, reply) => {
      await authenticate(request, reply);
    },
    schema: {
      description: 'Eliminar una lotería (solo administradores o creador, cualquier estado)',
      tags: ['Loterías'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer', description: 'ID de la lotería' }
        },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                title: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, lotteryController.deleteLottery);
}

module.exports = lotteryRoutes; 