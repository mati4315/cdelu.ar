const pool = require('../config/database');
const fs = require('node:fs');
const path = require('node:path');
const COM_UPLOAD_DIR = path.join(__dirname, '../../public/uploads/com_media');
const ALLOWED_COM_IMAGE_MIMES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_COM_VIDEO_MIMES = ['video/mp4'];

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

    return reply.status(200).send({
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

    return reply.status(200).send({
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

    // Obtener datos básicos del usuario
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

    // Consultar métricas del perfil en paralelo
    // - comments_count: total de comentarios del usuario
    // - lottery_participations: total de loterías en las que participó (tickets pagados)
    // - lottery_wins: total de loterías/tickets ganados
    const [
      [commentsCountRows],
      [lotteryParticipationsRows],
      [lotteryWinsRows],
      [communityPostsRows]
    ] = await Promise.all([
      pool.query(
        `SELECT COUNT(*) AS comments_count
         FROM comments
         WHERE user_id = ?`,
        [userId]
      ),
      pool.query(
        `SELECT COUNT(DISTINCT lottery_id) AS lottery_participations
         FROM lottery_tickets
         WHERE user_id = ? AND payment_status = 'paid'`,
        [userId]
      ),
      pool.query(
        `SELECT COUNT(*) AS lottery_wins
         FROM lottery_winners
         WHERE user_id = ?`,
        [userId]
      ),
      pool.query(
        `SELECT COUNT(*) AS community_posts_count
         FROM com
         WHERE user_id = ?`,
        [userId]
      )
    ]);

    const commentsCount = commentsCountRows?.[0]?.comments_count ?? 0;
    const lotteryParticipations = lotteryParticipationsRows?.[0]?.lottery_participations ?? 0;
    const lotteryWins = lotteryWinsRows?.[0]?.lottery_wins ?? 0;
    const communityPostsCount = communityPostsRows?.[0]?.community_posts_count ?? 0;

    return reply.status(200).send({
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        profile_picture_url: user.profile_picture_url,
        created_at: user.created_at,
        updated_at: user.updated_at,
        // Campo adicional para que el frontend lo consuma directamente si lo prefiere
        comments_count: commentsCount
      },
      // Objeto de estadísticas opcional
      stats: {
        lottery_participations: lotteryParticipations,
        lottery_wins: lotteryWins,
        community_posts_count: communityPostsCount
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
    
    return reply.status(200).send({
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
  getPublicUserProfile,
  listMyPosts,
  listUserPosts,
  updateMyComPost,
  deleteMyComPost,
  updateMyComPostMedia
}; 

/**
 * Listar posts de comunidad del usuario autenticado
 */
async function listMyPosts(request, reply) {
  try {
    const userId = request.user.id;
    const { page = 1, limit = 10, order = 'desc' } = request.query || {};
    const safeOrder = order === 'asc' ? 'ASC' : 'DESC';
    const offset = (Number(page) - 1) * Number(limit);

    const [[countRow]] = await pool.query(
      'SELECT COUNT(*) AS total FROM com WHERE user_id = ?',[userId]
    );

    const [rows] = await pool.query(
      `SELECT id, titulo, descripcion, image_url, video_url, created_at, updated_at
       FROM com
       WHERE user_id = ?
       ORDER BY created_at ${safeOrder}
       LIMIT ? OFFSET ?`,
      [userId, Number(limit), offset]
    );

    const data = rows.map(formatComRowImages);
    const total = countRow.total || 0;
    const totalPages = Math.ceil(total / Number(limit));

    return reply.send({
      data,
      pagination: { total, page: Number(page), limit: Number(limit), totalPages }
    });
  } catch (error) {
    request.log.error('Error al listar mis posts:', error);
    return reply.status(500).send({ error: 'Error interno del servidor' });
  }
}

/**
 * Listar posts de comunidad de un usuario público
 */
async function listUserPosts(request, reply) {
  try {
    const { userId } = request.params;
    const { page = 1, limit = 10, order = 'desc' } = request.query || {};
    const safeOrder = order === 'asc' ? 'ASC' : 'DESC';
    const offset = (Number(page) - 1) * Number(limit);

    const [[countRow]] = await pool.query(
      'SELECT COUNT(*) AS total FROM com WHERE user_id = ?',[userId]
    );

    const [rows] = await pool.query(
      `SELECT id, titulo, descripcion, image_url, video_url, created_at, updated_at
       FROM com
       WHERE user_id = ?
       ORDER BY created_at ${safeOrder}
       LIMIT ? OFFSET ?`,
      [userId, Number(limit), offset]
    );

    const data = rows.map(formatComRowImages);
    const total = countRow.total || 0;
    const totalPages = Math.ceil(total / Number(limit));

    return reply.send({
      data,
      pagination: { total, page: Number(page), limit: Number(limit), totalPages }
    });
  } catch (error) {
    request.log.error('Error al listar posts de usuario:', error);
    return reply.status(500).send({ error: 'Error interno del servidor' });
  }
}

/**
 * Actualizar un post de comunidad propio
 */
async function updateMyComPost(request, reply) {
  try {
    const userId = request.user.id;
    const { postId } = request.params;
    const { titulo, descripcion } = request.body || {};

    if (!titulo && !descripcion) {
      return reply.status(400).send({ error: 'No se proporcionaron datos para actualizar' });
    }

    const [[existing]] = await pool.query(
      'SELECT id, user_id FROM com WHERE id = ?', [postId]
    );
    if (!existing) {
      return reply.status(404).send({ error: 'Entrada no encontrada' });
    }
    if (existing.user_id !== userId) {
      return reply.status(403).send({ error: 'No tienes permiso para actualizar esta entrada' });
    }

    const updates = [];
    const values = [];
    if (titulo) { updates.push('titulo = ?'); values.push(titulo); }
    if (descripcion) { updates.push('descripcion = ?'); values.push(descripcion); }
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(postId);

    await pool.query(
      `UPDATE com SET ${updates.join(', ')} WHERE id = ?`, values
    );

    const [[row]] = await pool.query(
      'SELECT id, titulo, descripcion, image_url, video_url, created_at, updated_at FROM com WHERE id = ?',
      [postId]
    );

    return reply.send(formatComRowImages(row));
  } catch (error) {
    request.log.error('Error al actualizar post de comunidad:', error);
    return reply.status(500).send({ error: 'Error interno del servidor' });
  }
}

/**
 * Eliminar un post de comunidad propio (y archivos asociados si existen)
 */
async function deleteMyComPost(request, reply) {
  try {
    const userId = request.user.id;
    const { postId } = request.params;

    const [[existing]] = await pool.query(
      'SELECT id, user_id, video_url, image_url FROM com WHERE id = ?', [postId]
    );
    if (!existing) {
      return reply.status(404).send({ error: 'Entrada no encontrada' });
    }
    if (existing.user_id !== userId) {
      return reply.status(403).send({ error: 'No tienes permiso para eliminar esta entrada' });
    }

    await pool.query('DELETE FROM com WHERE id = ?', [postId]);

    // Eliminar archivos si existen (best-effort)
    try {
      if (existing.video_url) {
        const videoPath = path.join(COM_UPLOAD_DIR, path.basename(existing.video_url));
        if (fs.existsSync(videoPath)) { await fs.promises.unlink(videoPath); }
      }
      if (existing.image_url) {
        // image_url puede ser JSON con múltiples rutas
        let images = [];
        try {
          images = JSON.parse(existing.image_url);
        } catch (_) {
          images = [existing.image_url];
        }
        for (const img of images) {
          const imgPath = path.join(COM_UPLOAD_DIR, path.basename(img));
          if (fs.existsSync(imgPath)) { await fs.promises.unlink(imgPath); }
        }
      }
    } catch (cleanupErr) {
      request.log.warn({ msg: 'No se pudo eliminar uno o más archivos asociados', error: cleanupErr?.message });
    }

    return reply.send({ message: 'Entrada eliminada correctamente' });
  } catch (error) {
    request.log.error('Error al eliminar post de comunidad:', error);
    return reply.status(500).send({ error: 'Error interno del servidor' });
  }
}

function formatComRowImages(row) {
  if (!row) return row;
  let imageUrls = [];
  if (row.image_url && typeof row.image_url === 'string') {
    try {
      const parsed = JSON.parse(row.image_url);
      if (Array.isArray(parsed)) imageUrls = parsed;
    } catch (_) {
      imageUrls = [row.image_url];
    }
  }
  return {
    ...row,
    image_urls: imageUrls,
    image_url: imageUrls.length > 0 ? imageUrls[0] : null
  };
}

/**
 * Actualiza media (imágenes/video) de un post de comunidad propio.
 * Acepta multipart: image (1 o varias) y/o video. Permite removals por flags.
 */
async function updateMyComPostMedia(request, reply) {
  try {
    const userId = request.user.id;
    const { postId } = request.params;
    const body = request.body || {};

    const [[existing]] = await pool.query(
      'SELECT id, user_id, video_url, image_url FROM com WHERE id = ?', [postId]
    );
    if (!existing) return reply.status(404).send({ error: 'Entrada no encontrada' });
    if (existing.user_id !== userId) return reply.status(403).send({ error: 'No tienes permiso para actualizar esta entrada' });

    // Cargar helpers de com.controller sin duplicar lógica pesada
    // Reutilizamos estrategia local simple: guardar archivos en COM_UPLOAD_DIR
    // Nota: validaciones de tamaño ya existen en com.controller; aquí aplicamos límites conservadores
    const MAX_VIDEO_SIZE_BYTES = 200 * 1024 * 1024;
    const MAX_IMAGE_SIZE_BYTES_PER_FILE = 10 * 1024 * 1024;

    let currentImages = [];
    try {
      currentImages = existing.image_url ? JSON.parse(existing.image_url) : [];
      if (!Array.isArray(currentImages)) currentImages = [existing.image_url].filter(Boolean);
    } catch (_) {
      currentImages = [existing.image_url].filter(Boolean);
    }

    // Eliminaciones opcionales
    const removeVideo = body.remove_video && (body.remove_video.value === 'true' || body.remove_video === true);
    const removeImagesCsv = body.remove_images && (body.remove_images.value || '').toString();
    const removeImages = removeImagesCsv
      ? removeImagesCsv.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    // Agregados nuevos
    const newImages = [];
    if (body.image) {
      const imageFiles = Array.isArray(body.image) ? body.image : [body.image];
      for (const imageFile of imageFiles) {
      // Validar MIME
      const mimetype = imageFile?.mimetype || imageFile?.type;
      if (!ALLOWED_COM_IMAGE_MIMES.includes(String(mimetype || '').toLowerCase())) {
        return reply.status(400).send({ error: 'Tipo de imagen no permitido (jpg, png, webp)' });
      }
        const buf = await readMultipartToBuffer(imageFile);
        if (buf.length > MAX_IMAGE_SIZE_BYTES_PER_FILE) {
          return reply.status(400).send({ error: 'Imagen excede tamaño máximo (10MB)' });
        }
        const unique = `image-${Date.now()}-${Math.round(Math.random()*1e9)}.jpg`;
        const outPath = path.join(COM_UPLOAD_DIR, unique);
        await fs.promises.writeFile(outPath, buf);
        newImages.push(`/public/uploads/com_media/${unique}`);
      }
    }

    let newVideoUrl = existing.video_url;
    if (removeVideo) {
      if (existing.video_url) {
        const vpath = path.join(COM_UPLOAD_DIR, path.basename(existing.video_url));
        if (fs.existsSync(vpath)) { await fs.promises.unlink(vpath); }
      }
      newVideoUrl = null;
    }
    if (body.video) {
    // Validar MIME
    const mimetype = body.video?.mimetype || body.video?.type;
    if (!ALLOWED_COM_VIDEO_MIMES.includes(String(mimetype || '').toLowerCase())) {
      return reply.status(400).send({ error: 'Tipo de video no permitido (mp4)' });
    }
      const vbuf = await readMultipartToBuffer(body.video);
      if (vbuf.length > MAX_VIDEO_SIZE_BYTES) {
        return reply.status(400).send({ error: 'Video excede tamaño máximo (200MB)' });
      }
      const vname = `video-${Date.now()}-${Math.round(Math.random()*1e9)}.mp4`;
      const vout = path.join(COM_UPLOAD_DIR, vname);
      await fs.promises.writeFile(vout, vbuf);
      // Si había video anterior y no fue marcado para mantener, eliminarlo
      if (existing.video_url && existing.video_url !== `/public/uploads/com_media/${vname}`) {
        const old = path.join(COM_UPLOAD_DIR, path.basename(existing.video_url));
        if (fs.existsSync(old)) { await fs.promises.unlink(old); }
      }
      newVideoUrl = `/public/uploads/com_media/${vname}`;
    }

    // Construir set de imágenes final: quitar removidas, añadir nuevas
    const remaining = currentImages.filter(img => !removeImages.includes(path.basename(img)) && !removeImages.includes(img));
    const finalImages = [...remaining, ...newImages];

    await pool.query(
      'UPDATE com SET image_url = ?, video_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [finalImages.length ? JSON.stringify(finalImages) : null, newVideoUrl, postId]
    );

    const [[row]] = await pool.query(
      'SELECT id, titulo, descripcion, image_url, video_url, created_at, updated_at FROM com WHERE id = ?',
      [postId]
    );

    return reply.send(formatComRowImages(row));
  } catch (error) {
    request.log.error('Error al actualizar media del post:', error);
    return reply.status(500).send({ error: 'Error interno del servidor' });
  }
}

async function readMultipartToBuffer(filePart) {
  if (!filePart) return Buffer.alloc(0);
  if (filePart.value && Buffer.isBuffer(filePart.value)) return filePart.value;
  if (filePart._buf && Buffer.isBuffer(filePart._buf)) return filePart._buf;
  if (filePart.file) {
    const chunks = [];
    for await (const chunk of filePart.file) chunks.push(chunk);
    return Buffer.concat(chunks);
  }
  return Buffer.alloc(0);
}