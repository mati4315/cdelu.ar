/**
 * Middleware para validación de fotos de perfil
 * Valida tipo, tamaño y estructura del archivo antes del procesamiento
 */

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MIN_FILE_SIZE = 1024; // 1KB

/**
 * Middleware para validar archivos de foto de perfil
 * @param {Object} request - Objeto de solicitud Fastify
 * @param {Object} reply - Objeto de respuesta Fastify
 */
async function validateProfilePicture(request, reply) {
  try {
    const profilePictureFile = request.body.profile_picture;

    if (!profilePictureFile) {
      return reply.status(400).send({
        error: 'Campo profile_picture requerido',
        details: 'Debe proporcionar un archivo de imagen en el campo profile_picture'
      });
    }

    // Verificar que es un objeto con las propiedades necesarias
    if (!profilePictureFile.filename || !profilePictureFile.mimetype || !profilePictureFile.file) {
      return reply.status(400).send({
        error: 'Archivo de imagen inválido',
        details: 'El archivo no tiene la estructura esperada'
      });
    }

    // Validar tipo MIME
    if (!ALLOWED_MIME_TYPES.includes(profilePictureFile.mimetype)) {
      return reply.status(400).send({
        error: 'Tipo de archivo no permitido',
        details: `Solo se permiten los siguientes tipos: ${ALLOWED_MIME_TYPES.join(', ')}`,
        received: profilePictureFile.mimetype
      });
    }

    // Validar extensión del archivo
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const fileExtension = profilePictureFile.filename.toLowerCase().split('.').pop();
    const hasValidExtension = allowedExtensions.some(ext => ext.includes(fileExtension));
    
    if (!hasValidExtension) {
      return reply.status(400).send({
        error: 'Extensión de archivo no válida',
        details: `Solo se permiten archivos con extensiones: ${allowedExtensions.join(', ')}`,
        received: `.${fileExtension}`
      });
    }

    // Para validar tamaño, necesitamos leer el archivo (lo haremos en el controlador)
    // Aquí solo validamos que el archivo stream esté disponible
    if (!profilePictureFile.file || typeof profilePictureFile.file.read !== 'function') {
      return reply.status(400).send({
        error: 'Archivo corrupto o inválido',
        details: 'No se puede leer el contenido del archivo'
      });
    }

    // Agregar metadata de validación para uso posterior
    request.validationMetadata = {
      originalName: profilePictureFile.filename,
      mimeType: profilePictureFile.mimetype,
      maxAllowedSize: MAX_FILE_SIZE,
      minAllowedSize: MIN_FILE_SIZE
    };
  } catch (error) {
    request.log.error('Error en validación de foto de perfil:', error);
    return reply.status(500).send({
      error: 'Error interno en validación',
      details: 'No se pudo procesar la validación del archivo'
    });
  }
}

/**
 * Middleware para validar que el usuario está autenticado
 * @param {Object} request - Objeto de solicitud Fastify
 * @param {Object} reply - Objeto de respuesta Fastify
 */
async function requireAuthentication(request, reply) {
  try {
    await request.jwtVerify();
    
    if (!request.user || !request.user.id) {
      return reply.status(401).send({
        error: 'Usuario no válido',
        details: 'El token no contiene información de usuario válida'
      });
    }
  } catch (error) {
    return reply.status(401).send({
      error: 'Token de acceso requerido',
      details: 'Debe proporcionar un token JWT válido en el header Authorization'
    });
  }
}

/**
 * Middleware de limitación de velocidad para subida de fotos
 * Previene spam de subidas de archivos
 */
const profileUploadRateLimit = {
  max: 5, // máximo 5 intentos
  timeWindow: '1 minute', // por minuto
  skipSuccessfulRequests: true,
  keyFunction: (request) => {
    // Usar ID de usuario para limitar por usuario
    return request.user?.id || request.ip;
  },
  errorMessage: {
    error: 'Demasiados intentos de subida',
    details: 'Máximo 5 subidas de fotos por minuto. Intente nuevamente más tarde.'
  }
};

module.exports = {
  validateProfilePicture,
  requireAuthentication,
  profileUploadRateLimit,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
  MIN_FILE_SIZE
}; 