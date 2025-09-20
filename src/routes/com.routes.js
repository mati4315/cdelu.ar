const comController = require('../controllers/com.controller');
const { authenticate, authorize } = require('../middlewares/auth'); // Asumiendo que quieres proteger estas rutas

/**
 * Esquemas de validación para las rutas de 'com' (comunicaciones/entradas de usuario)
 */
const schemas = {
  // Esquema para el cuerpo de la petición al crear/actualizar una entrada 'com'
  comBodySchema: {
    type: 'object',
    required: ['titulo', 'descripcion'],
    properties: {
      titulo: { type: 'string', minLength: 1 },
      descripcion: { type: 'string', minLength: 1 },
      // video_url y image_url se manejarán por separado si son subidas de archivos,
      // o podrían ser URLs directas si ya están alojadas en otro lugar.
      // Por ahora, los omitimos del schema de body directo, asumiendo subida.
    }
  },
  // Esquema para la respuesta de una entrada 'com'
  comResponseSchema: {
    $id: 'comResponseSchema',
    type: 'object',
    properties: {
      id: { type: 'integer' },
      titulo: { type: 'string' },
      descripcion: { type: 'string' },
      video_url: { type: 'string', nullable: true },
      image_url: { type: 'string', nullable: true },
      user_id: { type: 'integer' },
      created_at: { type: 'string', format: 'date-time' },
      updated_at: { type: 'string', format: 'date-time' },
      // Podríamos añadir más detalles del usuario si es necesario, ej. nombre de usuario
      // author: { 
      //   type: 'object',
      //   properties: {
      //     id: { type: 'integer' },
      //     nombre: { type: 'string' }
      //   }
      // }
    }
  },
  // Esquema para listar múltiples entradas 'com'
  comListResponseSchema: {
    $id: 'comListResponseSchema',
    type: 'object',
    properties: {
      data: {
        type: 'array',
        items: { $ref: 'comResponseSchema#' }
      },
      // Podríamos añadir paginación aquí si es necesario
      // total: { type: 'integer' },
      // page: { type: 'integer' },
      // limit: { type: 'integer' }
    }
  }
};

/**
 * Plugin de Fastify para las rutas de 'com'
 * @param {FastifyInstance} fastify - Instancia de Fastify
 * @param {Object} options - Opciones del plugin
 */
async function comRoutes(fastify, options) {
  // Añadir schemas para que fastify-swagger los pueda usar y para $ref funcione
  fastify.addSchema(schemas.comResponseSchema);
  fastify.addSchema(schemas.comListResponseSchema);


  // Crear una nueva entrada 'com'
  // Solo usuarios con rol 'usuario' (o el que definas) pueden crear.
  fastify.post('/api/v1/com', {
    onRequest: [authenticate, authorize(['usuario', 'colaborador', 'administrador'])],
    schema: {
      tags: ['com'],
      summary: 'Crear una nueva entrada de comunicación con archivos adjuntos (opcional)',
      consumes: ['multipart/form-data'], // Especificar que consume multipart
      body: {
        type: 'object',
        required: ['titulo', 'descripcion'],
        properties: {
          titulo: { // Ahora 'titulo' es un objeto
            type: 'object',
            required: ['value'],
            properties: {
              value: { type: 'string', minLength: 1 }
              // podrías añadir otras validaciones para las propiedades del campo multipart si es necesario
            }
          },
          descripcion: { // Ahora 'descripcion' es un objeto
            type: 'object',
            required: ['value'],
            properties: {
              value: { type: 'string', minLength: 1 }
            }
          },
          video: { type: 'object' }, // Para el archivo de video, 'object' está bien ya que fastify-multipart lo maneja
          image: { // Para el/los archivo(s) de imagen
            oneOf: [
              { type: 'object' }, // Caso: un solo archivo de imagen
              {                 // Caso: múltiples archivos de imagen
                type: 'array',
                items: { type: 'object' }
              }
            ]
          }
        }
      },
      response: {
        201: {
          description: 'Entrada creada exitosamente',
          $ref: 'comResponseSchema#'
        },
        400: { description: 'Entrada inválida' },
        401: { description: 'No autorizado' },
        403: { description: 'Prohibido' }
      }
    }
  }, comController.createComEntry);

  // Obtener todas las entradas 'com' (público o protegido según necesidad)
  fastify.get('/api/v1/com', {
    // onRequest: [authenticate], // Descomentar si se requiere autenticación para listar
    schema: {
      tags: ['com'],
      summary: 'Obtener todas las entradas de comunicación',
      // Podrías añadir query params para paginación, filtros, etc.
      // querystring: {
      //   type: 'object',
      //   properties: {
      //     page: { type: 'integer', minimum: 1, default: 1 },
      //     limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
      //     userId: { type: 'integer' } // para filtrar por usuario
      //   }
      // },
      response: {
        200: {
          description: 'Lista de entradas de comunicación',
          $ref: 'comListResponseSchema#'
        }
      }
    }
  }, comController.getAllComEntries);

  // Obtener una entrada 'com' por ID (público o protegido)
  fastify.get('/api/v1/com/:id', {
    // onRequest: [authenticate], // Descomentar si se requiere autenticación
    schema: {
      tags: ['com'],
      summary: 'Obtener una entrada de comunicación por ID',
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer', minimum: 1 }
        },
        required: ['id']
      },
      response: {
        200: {
          description: 'Detalles de la entrada de comunicación',
          $ref: 'comResponseSchema#'
        },
        404: { description: 'Entrada no encontrada' }
      }
    }
  }, comController.getComEntryById);

  // (Opcional) Actualizar una entrada 'com' por ID
  // Solo el creador de la entrada o un administrador/editor podrían actualizar.
  fastify.put('/api/v1/com/:id', {
    onRequest: [authenticate, authorize(['usuario', 'administrador', 'editor'])], // o una lógica más fina en el handler
    schema: {
      tags: ['com'],
      summary: 'Actualizar una entrada de comunicación por ID',
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer', minimum: 1 }
        },
        required: ['id']
      },
      body: schemas.comBodySchema, // Podría ser un schema parcial para permitir actualizaciones de campos específicos
      response: {
        200: {
          description: 'Entrada actualizada exitosamente',
          $ref: 'comResponseSchema#'
        },
        400: { description: 'Entrada inválida' },
        401: { description: 'No autorizado' },
        403: { description: 'Prohibido (ej. no es el dueño o no tiene permisos)' },
        404: { description: 'Entrada no encontrada' }
      }
    }
  }, comController.updateComEntry);

  // (Opcional) Eliminar una entrada 'com' por ID
  // Solo el creador de la entrada o un administrador/editor podrían eliminar.
  fastify.delete('/api/v1/com/:id', {
    onRequest: [authenticate, authorize(['usuario', 'administrador', 'editor'])], // o una lógica más fina en el handler
    schema: {
      tags: ['com'],
      summary: 'Eliminar una entrada de comunicación por ID',
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer', minimum: 1 }
        },
        required: ['id']
      },
      response: {
        204: {
          type: 'null',
          description: 'Entrada eliminada correctamente'
        },
        401: { description: 'No autorizado' },
        403: { description: 'Prohibido (ej. no es el dueño o no tiene permisos)' },
        404: { description: 'Entrada no encontrada' }
      }
    }
  }, comController.deleteComEntry);
}

module.exports = comRoutes; 