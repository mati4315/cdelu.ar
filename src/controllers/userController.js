const pool = require('../config/database');
const fs = require('node:fs');
const path = require('node:path');

// Hacer Sharp opcional para evitar errores en hosting
let sharp = null;
try {
  sharp = require('sharp');
  console.log('✅ Sharp cargado correctamente para fotos de perfil');
} catch (error) {
  console.log('⚠️ Sharp no disponible - las fotos de perfil se guardarán sin procesamiento');
}

// Directorio para guardar las fotos de perfil
const PROFILE_UPLOAD_DIR = path.join(__dirname, '../../public/uploads/profile-pictures');

// Crear el directorio si no existe
if (!fs.existsSync(PROFILE_UPLOAD_DIR)) {
  fs.mkdirSync(PROFILE_UPLOAD_DIR, { recursive: true });
}

// Configuración para fotos de perfil
const MAX_PROFILE_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const PROFILE_IMAGE_DIMENSIONS = { width: 300, height: 300 }; // Imagen cuadrada de 300x300

/**
 * Procesa y guarda una foto de perfil
 * @param {object} fileData - El objeto de archivo de fastify-multipart
 * @returns {Promise<string|null>} La URL relativa del archivo guardado o null si hay error
 */
async function saveProfilePicture(fileData) {
  console.log(`[saveProfilePicture] Procesando foto de perfil: ${fileData?.filename}, tipo: ${fileData?.mimetype}`);
  
  // Debug: inspeccionar estructura del archivo
  console.log('[DEBUG] Estructura del fileData:', {
    hasFile: !!fileData?.file,
    hasValue: !!fileData?.value,
    hasBuf: !!fileData?._buf,
    keys: Object.keys(fileData || {}),
    fileType: typeof fileData?.file,
    valueType: typeof fileData?.value
  });

  if (!fileData || !fileData.filename || !fileData.mimetype) {
    console.error('[saveProfilePicture] Error: archivo no válido');
    return null;
  }

  // Verificar tipo de archivo
  if (!ALLOWED_IMAGE_TYPES.includes(fileData.mimetype)) {
    throw new Error(`Tipo de archivo no permitido. Solo se permiten: ${ALLOWED_IMAGE_TYPES.join(', ')}`);
  }

  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const outputFilename = `profile-${uniqueSuffix}.jpg`; // Siempre guardar como JPG
  const outputFilePath = path.join(PROFILE_UPLOAD_DIR, outputFilename);
  const publicFilePath = `/uploads/profile-pictures/${outputFilename}`;

  try {
    // Leer el archivo de fastify-multipart
    let fileBuffer;
    
    // Con attachFieldsToBody: true, el contenido está en .value
    if (fileData.value && Buffer.isBuffer(fileData.value)) {
      fileBuffer = fileData.value;
      console.log(`✅ Archivo leído usando .value - Tamaño: ${fileBuffer.length} bytes`);
    } else if (fileData._buf && Buffer.isBuffer(fileData._buf)) {
      fileBuffer = fileData._buf;
      console.log(`✅ Archivo leído usando ._buf - Tamaño: ${fileBuffer.length} bytes`);
    } else if (fileData.file) {
      // Fallback: leer stream completo si es necesario
      const chunks = [];
      for await (const chunk of fileData.file) {
        chunks.push(chunk);
      }
      fileBuffer = Buffer.concat(chunks);
      console.log(`✅ Archivo leído usando stream - Tamaño: ${fileBuffer.length} bytes`);
    } else {
      throw new Error('No se pudo encontrar el contenido del archivo en ninguna propiedad (.value, ._buf, .file)');
    }

    // Verificar que tenemos un buffer válido
    if (!fileBuffer || !Buffer.isBuffer(fileBuffer) || fileBuffer.length === 0) {
      throw new Error('El archivo está vacío o no se pudo procesar correctamente');
    }

    // Verificar tamaño
    if (fileBuffer.length > MAX_PROFILE_IMAGE_SIZE_BYTES) {
      throw new Error(`El archivo es demasiado grande. Máximo permitido: ${MAX_PROFILE_IMAGE_SIZE_BYTES / (1024 * 1024)}MB`);
    }

    if (sharp) {
      // Procesar imagen con Sharp: redimensionar y optimizar
      await sharp(fileBuffer)
        .resize(PROFILE_IMAGE_DIMENSIONS.width, PROFILE_IMAGE_DIMENSIONS.height, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 85 })
        .toFile(outputFilePath);
      
      console.log(`✅ Foto de perfil procesada y guardada: ${outputFilePath}`);
    } else {
      // Guardar sin procesamiento si Sharp no está disponible
      await fs.promises.writeFile(outputFilePath, fileBuffer);
      console.log(`✅ Foto de perfil guardada sin procesamiento: ${outputFilePath}`);
    }

    return publicFilePath;
  } catch (error) {
    console.error('[saveProfilePicture] Error al procesar la imagen:', error);
    throw error;
  }
}

/**
 * Elimina una foto de perfil del sistema de archivos
 * @param {string} profilePictureUrl - URL de la foto de perfil a eliminar
 */
async function deleteProfilePicture(profilePictureUrl) {
  if (!profilePictureUrl) return;

  try {
    const filename = path.basename(profilePictureUrl);
    const filePath = path.join(PROFILE_UPLOAD_DIR, filename);
    
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      console.log(`✅ Foto de perfil eliminada: ${filePath}`);
    }
  } catch (error) {
    console.error('[deleteProfilePicture] Error al eliminar foto de perfil:', error);
    // No lanzar error, solo registrar - la imagen puede no existir
  }
}

/**
 * Sube una nueva foto de perfil para el usuario autenticado
 * @param {Object} request - Objeto de solicitud Fastify
 * @param {Object} reply - Objeto de respuesta Fastify
 */
async function uploadProfilePicture(request, reply) {
  try {
    const userId = request.user.id;
    
    // Obtener el archivo de la solicitud
    const profilePictureFile = request.body.profile_picture;
    
    if (!profilePictureFile) {
      return reply.status(400).send({ 
        error: 'No se proporcionó ninguna imagen. El campo debe llamarse "profile_picture"' 
      });
    }

    // Obtener la foto de perfil actual del usuario
    const [users] = await pool.query(
      'SELECT profile_picture_url FROM users WHERE id = ?',
      [userId]
    );

    const currentProfilePicture = users[0]?.profile_picture_url;

    // Procesar y guardar la nueva foto
    const newProfilePictureUrl = await saveProfilePicture(profilePictureFile);

    if (!newProfilePictureUrl) {
      return reply.status(500).send({ error: 'Error al procesar la imagen' });
    }

    // Actualizar la base de datos
    await pool.query(
      'UPDATE users SET profile_picture_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newProfilePictureUrl, userId]
    );

    // Eliminar la foto anterior si existe y es diferente
    if (currentProfilePicture && currentProfilePicture !== newProfilePictureUrl) {
      await deleteProfilePicture(currentProfilePicture);
    }

    reply.status(200).send({
      message: 'Foto de perfil actualizada correctamente',
      profile_picture_url: newProfilePictureUrl
    });

  } catch (error) {
    request.log.error('Error al subir foto de perfil:', error);
    reply.status(500).send({ 
      error: error.message || 'Error interno del servidor' 
    });
  }
}

/**
 * Elimina la foto de perfil del usuario autenticado
 * @param {Object} request - Objeto de solicitud Fastify
 * @param {Object} reply - Objeto de respuesta Fastify
 */
async function removeProfilePicture(request, reply) {
  try {
    const userId = request.user.id;

    // Obtener la foto de perfil actual
    const [users] = await pool.query(
      'SELECT profile_picture_url FROM users WHERE id = ?',
      [userId]
    );

    const currentProfilePicture = users[0]?.profile_picture_url;

    if (!currentProfilePicture) {
      return reply.status(404).send({ error: 'El usuario no tiene foto de perfil' });
    }

    // Actualizar la base de datos
    await pool.query(
      'UPDATE users SET profile_picture_url = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [userId]
    );

    // Eliminar el archivo
    await deleteProfilePicture(currentProfilePicture);

    reply.status(200).send({
      message: 'Foto de perfil eliminada correctamente'
    });

  } catch (error) {
    request.log.error('Error al eliminar foto de perfil:', error);
    reply.status(500).send({ error: 'Error interno del servidor' });
  }
}

/**
 * Obtiene el perfil del usuario autenticado
 * @param {Object} request - Objeto de solicitud Fastify
 * @param {Object} reply - Objeto de respuesta Fastify
 */
async function getUserProfile(request, reply) {
  try {
    const userId = request.user.id;

    const [users] = await pool.query(
      `SELECT id, nombre, email, profile_picture_url, rol, 
              created_at, updated_at
       FROM users 
       WHERE id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return reply.status(404).send({ error: 'Usuario no encontrado' });
    }

    const user = users[0];
    
    reply.status(200).send({
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        profile_picture_url: user.profile_picture_url,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    });

  } catch (error) {
    request.log.error('Error al obtener perfil de usuario:', error);
    reply.status(500).send({ error: 'Error interno del servidor' });
  }
}

/**
 * Obtiene el perfil público de un usuario por ID
 * @param {Object} request - Objeto de solicitud Fastify
 * @param {Object} reply - Objeto de respuesta Fastify
 */
async function getPublicUserProfile(request, reply) {
  try {
    const { userId } = request.params;

    const [users] = await pool.query(
      `SELECT id, nombre, profile_picture_url, rol, created_at
       FROM users 
       WHERE id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return reply.status(404).send({ error: 'Usuario no encontrado' });
    }

    const user = users[0];
    
    reply.status(200).send({
      user: {
        id: user.id,
        nombre: user.nombre,
        rol: user.rol,
        profile_picture_url: user.profile_picture_url,
        created_at: user.created_at
      }
    });

  } catch (error) {
    request.log.error('Error al obtener perfil público de usuario:', error);
    reply.status(500).send({ error: 'Error interno del servidor' });
  }
}

module.exports = {
  uploadProfilePicture,
  removeProfilePicture,
  getUserProfile,
  getPublicUserProfile
}; 