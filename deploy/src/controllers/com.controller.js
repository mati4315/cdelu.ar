const pool = require('../config/database'); // Ajusta la ruta si es diferente
const fs = require('node:fs');
const util = require('node:util');
const path = require('node:path');

// Hacer Sharp y FFmpeg opcionales para evitar errores en hosting
let sharp = null;
let ffmpeg = null;
let ffmpegInstaller = null;

try {
  sharp = require('sharp');
  console.log('✅ Sharp cargado correctamente');
} catch (error) {
  console.log('⚠️ Sharp no disponible - las imágenes se guardarán sin procesamiento');
}

try {
  ffmpeg = require('fluent-ffmpeg');
  ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
  if (ffmpegInstaller && ffmpegInstaller.path) {
    ffmpeg.setFfmpegPath(ffmpegInstaller.path);
    console.log('✅ FFmpeg cargado correctamente');
  }
} catch (error) {
  console.log('⚠️ FFmpeg no disponible - los videos se guardarán sin procesamiento');
}

// Asegúrate de que este directorio exista en tu carpeta 'public' o donde decidas guardarlos.
// Y que tu servidor sirva archivos estáticos desde 'public'.
const UPLOAD_DIR = path.join(__dirname, '../../public/uploads/com_media'); 
// Crear el directorio si no existe (de forma síncrona al inicio)
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const MAX_VIDEO_SIZE_BYTES = 200 * 1024 * 1024; // 200MB
const MAX_IMAGES_COUNT = 6;
const MAX_IMAGE_SIZE_BYTES_PER_FILE = 10 * 1024 * 1024; // 10MB

/**
 * Guarda un archivo subido (procesando imágenes y videos sincrónicamente) y retorna su ruta relativa.
 * @param {object} fileData - El objeto de archivo de fastify-multipart.
 * @param {string} destinationDir - El directorio donde guardar el archivo.
 * @param {number} [maxIndividualFileSize] - Tamaño máximo permitido para este archivo en bytes.
 * @returns {Promise<string|null>} La ruta relativa del archivo guardado o null si no hay archivo.
 * @throws {Error} Si el archivo guardado excede maxIndividualFileSize o si hay un error al guardar/procesar.
 */
async function saveFile(fileData, destinationDir, maxIndividualFileSize) {
  console.log(`[saveFile] Iniciando guardado para: ${fileData ? fileData.filename : 'archivo desconocido'}, mimetype: ${fileData ? fileData.mimetype : 'N/A'}`);

  if (!fileData || !fileData.filename || !fileData.mimetype) {
    console.error('[saveFile] Error: fileData no válido, sin filename o sin mimetype.');
    return null;
  }

  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const originalExtension = path.extname(fileData.filename) || '';
  let outputExtension = originalExtension;
  const baseFilename = fileData.fieldname + '-' + uniqueSuffix;

  const isImage = fileData.mimetype.startsWith('image/');
  const isVideo = fileData.mimetype.startsWith('video/');

  if (isImage && !['.gif', '.webp'].includes(originalExtension.toLowerCase())) {
    outputExtension = '.jpg';
  } else if (isVideo) {
    outputExtension = '.mp4';
  }
  
  const outputFilename = baseFilename + outputExtension;
  const tempOutputFilePath = path.join(destinationDir, `temp_processing-${outputFilename}`); // Para ffmpeg si necesita un archivo de entrada
  const finalOutputFilePath = path.join(destinationDir, outputFilename);
  const publicFilePath = path.join('/public/uploads/com_media', outputFilename).replace(/\\/g, '/');

  try {
    let fileBuffer;
    if (fileData._buf && fileData._buf instanceof Buffer) {
      fileBuffer = fileData._buf;
    } else if (fileData.file && fileData.file.readable) {
      const chunks = [];
      for await (const chunk of fileData.file) {
        chunks.push(chunk);
      }
      fileBuffer = Buffer.concat(chunks);
    } else {
      throw new Error(`No se pudo obtener el contenido del archivo para ${fileData.filename}.`);
    }

    if (fileBuffer.length === 0) {
        throw new Error(`El archivo ${fileData.filename} está vacío.`);
    }

    // Validar tamaño del archivo original ANTES de procesar
    if (maxIndividualFileSize && fileBuffer.length > maxIndividualFileSize) {
      throw new Error(`El archivo original ${fileData.filename} (${fileBuffer.length} bytes) excede el límite de ${maxIndividualFileSize / (1024*1024)}MB.`);
    }

    if (isImage && !fileData.mimetype.includes('gif')) {
      if (sharp) {
        console.log(`[saveFile] Procesando imagen ${fileData.filename} con sharp.`);
        await sharp(fileBuffer)
          .jpeg({ quality: 75, progressive: true, optimizeScans: true })
          .toFile(finalOutputFilePath);
        console.log(`[saveFile] Imagen ${outputFilename} procesada y guardada.`);
      } else {
        console.log(`[saveFile] Guardando imagen ${fileData.filename} sin procesamiento (Sharp no disponible).`);
        fs.writeFileSync(finalOutputFilePath, fileBuffer);
      }
    } else if (isVideo) {
      if (ffmpeg && ffmpegInstaller) {
        console.log(`[saveFile] Procesando video ${fileData.filename} con ffmpeg (síncrono).`);
        fs.writeFileSync(tempOutputFilePath, fileBuffer); // Guardar temporalmente para que ffmpeg lo lea

        await new Promise((resolve, reject) => {
          ffmpeg(tempOutputFilePath)
            .outputOptions([
              '-vf scale=w=480:h=-2:force_original_aspect_ratio=decrease',
              '-c:v libx264',
              '-preset medium',
              '-crf 23',
              '-c:a aac',
              '-b:a 128k'
            ])
            .on('error', (err) => {
              console.error(`[saveFile] Error de FFmpeg para ${fileData.filename}: ${err.message}`);
              reject(new Error(`Error al procesar video ${fileData.filename}: ${err.message}`));
            })
            .on('end', () => {
              console.log(`[saveFile] Video ${outputFilename} procesado y guardado.`);
              resolve();
            })
            .save(finalOutputFilePath);
        });
        
        if (fs.existsSync(tempOutputFilePath)) {
            fs.unlinkSync(tempOutputFilePath);
        }
      } else {
        console.log(`[saveFile] Guardando video ${fileData.filename} sin procesamiento (FFmpeg no disponible).`);
        fs.writeFileSync(finalOutputFilePath, fileBuffer);
      }
    } else { // GIFs u otros tipos de archivo
      console.log(`[saveFile] Guardando archivo ${fileData.filename} (tipo ${fileData.mimetype}) sin procesamiento adicional.`);
      fs.writeFileSync(finalOutputFilePath, fileBuffer);
    }

    const stats = fs.statSync(finalOutputFilePath);
    if (stats.size === 0) {
      throw new Error(`El archivo ${outputFilename} se procesó/guardó pero resultó en 0 bytes.`);
    }
    
    return publicFilePath;

  } catch (err) {
    console.error(`[saveFile] Falla al procesar o guardar ${fileData.filename}: ${err.message}`, err.stack);
    // Limpiar archivos si se crearon y hubo error
    if (fs.existsSync(tempOutputFilePath)) { try { fs.unlinkSync(tempOutputFilePath); } catch (e) { /* ignore */ } }
    if (fs.existsSync(finalOutputFilePath)) { try { fs.unlinkSync(finalOutputFilePath); } catch (e) { /* ignore */ } }
    throw err; 
  }
}

/**
 * Crea una nueva entrada de comunicación (com).
 * @param {FastifyRequest} request - La solicitud de Fastify.
 * @param {FastifyReply} reply - La respuesta de Fastify.
 */
async function createComEntry(request, reply) {
  const loggableBody = {};
  if (request.body.titulo) loggableBody.titulo = `Presente (campo)`;
  if (request.body.descripcion) loggableBody.descripcion = `Presente (campo)`;
  if (request.body.video) loggableBody.video = `Presente (archivo: ${request.body.video.filename})`;
  if (request.body.image) {
    if (Array.isArray(request.body.image)) {
      loggableBody.image = `Presente (archivos: ${request.body.image.map(f => f.filename).join(', ')})`;
    } else {
      loggableBody.image = `Presente (archivo: ${request.body.image.filename})`;
    }
  }
  console.log('[createComEntry] Iniciando. Campos recibidos:', loggableBody);

  const titulo = request.body.titulo ? request.body.titulo.value : undefined;
  const descripcion = request.body.descripcion ? request.body.descripcion.value : undefined;
  const userId = request.user.id;

  if (!titulo || !descripcion) {
    return reply.status(400).send({ error: 'Título y descripción son requeridos' });
  }

  const videoFile = request.body.video;
  let imageFiles = request.body.image;
  if (imageFiles && !Array.isArray(imageFiles)) {
    imageFiles = [imageFiles];
  } else if (!imageFiles) {
    imageFiles = [];
  }

  let videoUrl = null;
  let imageUrls = [];
  // let videoProcessingJobId = null; // Eliminado

  try {
    // Procesar y guardar imágenes
    if (imageFiles.length > 0) {
      if (imageFiles.length > MAX_IMAGES_COUNT) {
        return reply.status(400).send({ error: `No puede subir más de ${MAX_IMAGES_COUNT} imágenes.` });
      }
      for (const imageFile of imageFiles) {
        const singleImageResult = await saveFile(imageFile, UPLOAD_DIR, MAX_IMAGE_SIZE_BYTES_PER_FILE);
        if (singleImageResult && typeof singleImageResult === 'string') {
          imageUrls.push(singleImageResult);
        } else {
            request.log.warn('[createComEntry] saveFile no devolvió una URL para una imagen.', singleImageResult);
        }
      }
    }

    // Procesar y guardar video (sincrónicamente ahora)
    if (videoFile) {
      // La validación de tamaño ahora está dentro de saveFile antes de procesar.
      videoUrl = await saveFile(videoFile, UPLOAD_DIR, MAX_VIDEO_SIZE_BYTES);
      if (!videoUrl) {
        throw new Error('No se pudo guardar y procesar el archivo de video.');
      }
    }
    
    let imageUrlJsonToDb = null;
    if (imageUrls.length > 0) {
      imageUrlJsonToDb = JSON.stringify(imageUrls);
    }

    const connection = await pool.getConnection();
    try {
      const [result] = await connection.execute(
        'INSERT INTO com (titulo, descripcion, user_id, video_url, image_url) VALUES (?, ?, ?, ?, ?)',
        // Ya no se inserta video_status
        [titulo, descripcion, userId, videoUrl, imageUrlJsonToDb]
      );
      
      const comEntryId = result.insertId;

      // Ya no se encola ningún trabajo

      const [rows] = await connection.execute('SELECT * FROM com WHERE id = ?', [comEntryId]);
      const createdEntry = rows[0];

      if (createdEntry && createdEntry.image_url && typeof createdEntry.image_url === 'string') {
        try {
          createdEntry.image_urls = JSON.parse(createdEntry.image_url);
        } catch (e) {
          request.log.warn({ msg: 'No se pudo parsear image_url desde la DB como JSON', image_url: createdEntry.image_url, error: e.message });
          createdEntry.image_urls = [];
        }
      } else if (createdEntry) {
        createdEntry.image_urls = [];
      }
      // Compat: exponer también image_url como la primera imagen si existe
      createdEntry.image_url = Array.isArray(createdEntry.image_urls) && createdEntry.image_urls.length > 0 ? createdEntry.image_urls[0] : null;

      reply.status(201).send(createdEntry);
    } finally {
      connection.release();
    }
  } catch (error) {
    const errorDetails = error instanceof Error ? { message: error.message, name: error.name } : { message: String(error) };
    request.log.error('Error en createComEntry:', errorDetails, error.stack);
    reply.status(error.statusCode || 500).send({ error: 'Error al crear la entrada de comunicación', details: error.message || String(error) });
  }
}

/**
 * Obtiene todas las entradas de comunicación.
 * @param {FastifyRequest} request - La solicitud de Fastify.
 * @param {FastifyReply} reply - La respuesta de Fastify.
 */
async function getAllComEntries(request, reply) {
  try {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT c.*, u.nombre as autor_nombre 
         FROM com c 
         JOIN users u ON c.user_id = u.id 
         ORDER BY c.created_at DESC`
      );
      const processedRows = rows.map(entry => {
        if (entry.image_url && typeof entry.image_url === 'string') {
          try {
            entry.image_urls = JSON.parse(entry.image_url);
          } catch (e) {
            // No loguear error por cada fila en producción para getAll, podría ser ruidoso
            // request.log.warn({ msg: 'getAllComEntries: No se pudo parsear image_url', id: entry.id }); 
            entry.image_urls = [];
          }
        }
        entry.image_url = Array.isArray(entry.image_urls) && entry.image_urls.length > 0 ? entry.image_urls[0] : null;
        return entry;
      });
      reply.send({ data: processedRows });
    } finally {
      connection.release();
    }
  } catch (error) {
    request.log.error({ message: "Error en getAllComEntries", error: error.message }); // No stack aquí por defecto
    reply.status(500).send({ error: 'Error al obtener las entradas de comunicación' });
  }
}

/**
 * Obtiene una entrada de comunicación por su ID.
 * @param {FastifyRequest} request - La solicitud de Fastify.
 * @param {FastifyReply} reply - La respuesta de Fastify.
 */
async function getComEntryById(request, reply) {
  const { id } = request.params;
  try {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT c.*, u.nombre as autor_nombre 
         FROM com c 
         JOIN users u ON c.user_id = u.id 
         WHERE c.id = ?`
      , [id]);
      if (rows.length === 0) {
        return reply.status(404).send({ error: 'Entrada de comunicación no encontrada' });
      }
      const entry = rows[0];
      if (entry.image_url && typeof entry.image_url === 'string') {
        try {
          entry.image_urls = JSON.parse(entry.image_url);
        } catch (e) {
          // request.log.warn({ msg: 'getComEntryById: No se pudo parsear image_url', id: entry.id });
          entry.image_urls = [];
        }
      }
      entry.image_url = Array.isArray(entry.image_urls) && entry.image_urls.length > 0 ? entry.image_urls[0] : null;
      reply.send(entry);
    } finally {
      connection.release();
    }
  } catch (error) {
    request.log.error({ message: "Error en getComEntryById", params: request.params, error: error.message }); // No stack
    reply.status(500).send({ error: 'Error al obtener la entrada de comunicación' });
  }
}

/**
 * Actualiza una entrada de comunicación existente.
 * @param {FastifyRequest} request - La solicitud de Fastify.
 * @param {FastifyReply} reply - La respuesta de Fastify.
 */
async function updateComEntry(request, reply) {
  const { id } = request.params;
  const titulo = request.body.titulo ? request.body.titulo.value : undefined;
  const descripcion = request.body.descripcion ? request.body.descripcion.value : undefined;
  const video_url_field = request.body.video_url ? request.body.video_url.value : undefined;
  const image_url_field = request.body.image_url ? request.body.image_url.value : undefined;
  const userId = request.user.id;

  if (!titulo && !descripcion && video_url_field === undefined && image_url_field === undefined) {
    return reply.status(400).send({ error: 'No se proporcionaron datos para actualizar' });
  }

  // Aquí también necesitarías manejar la subida de nuevos archivos si se permite en la actualización.
  // Por ahora, solo actualiza campos de texto y URLs existentes.

  try {
    const connection = await pool.getConnection();
    try {
      const [comEntries] = await connection.execute('SELECT user_id, video_url, image_url FROM com WHERE id = ?', [id]);
      if (comEntries.length === 0) {
        connection.release();
        return reply.status(404).send({ error: 'Entrada no encontrada' });
      }

      const entryOwnerId = comEntries[0].user_id;
      if (entryOwnerId !== userId && !['administrador', 'editor'].includes(request.user.role)) {
        connection.release();
        return reply.status(403).send({ error: 'No tienes permiso para actualizar esta entrada' });
      }

      const fieldsToUpdate = {};
      if (titulo) fieldsToUpdate.titulo = titulo;
      if (descripcion) fieldsToUpdate.descripcion = descripcion;
      // Si se envían explícitamente null o strings vacíos para borrar URLs, se manejan.
      // Si el campo no se envía (undefined), no se toca la URL existente.
      if (video_url_field !== undefined) fieldsToUpdate.video_url = video_url_field; 
      if (image_url_field !== undefined) fieldsToUpdate.image_url = image_url_field;
      
      if (Object.keys(fieldsToUpdate).length === 0) {
        connection.release();
        return reply.status(400).send({ error: 'No hay campos válidos para actualizar.'});
      }

      fieldsToUpdate.updated_at = new Date();
      const setClauses = Object.keys(fieldsToUpdate).map(key => `${key} = ?`).join(', ');
      const values = [...Object.values(fieldsToUpdate), id];

      await connection.execute(`UPDATE com SET ${setClauses} WHERE id = ?`, values);
      const [updatedRows] = await connection.execute('SELECT * FROM com WHERE id = ?', [id]);
      reply.send(updatedRows[0]);
    } finally {
      connection.release();
    }
  } catch (error) {
    request.log.error({ message: "Error en updateComEntry", params: request.params, body: request.body, error: error.message, stack: error.stack });
    reply.status(500).send({ error: 'Error al actualizar la entrada de comunicación' });
  }
}

/**
 * Elimina una entrada de comunicación.
 * @param {FastifyRequest} request - La solicitud de Fastify.
 * @param {FastifyReply} reply - La respuesta de Fastify.
 */
async function deleteComEntry(request, reply) {
  const { id } = request.params;
  const userId = request.user.id;

  try {
    const connection = await pool.getConnection();
    try {
      const [comEntries] = await connection.execute('SELECT user_id, video_url, image_url FROM com WHERE id = ?', [id]);
      if (comEntries.length === 0) {
        connection.release();
        return reply.status(404).send({ error: 'Entrada no encontrada' });
      }

      const entryOwnerId = comEntries[0].user_id;
      const { video_url: oldVideoUrl, image_url: oldImageUrl } = comEntries[0];

      if (entryOwnerId !== userId && !['administrador', 'editor'].includes(request.user.role)) {
        connection.release();
        return reply.status(403).send({ error: 'No tienes permiso para eliminar esta entrada' });
      }

      await connection.execute('DELETE FROM com WHERE id = ?', [id]);

      if (oldVideoUrl) {
        const videoPath = path.join(UPLOAD_DIR, path.basename(oldVideoUrl)); // Asume que oldVideoUrl es solo el nombre del archivo o una subruta desde UPLOAD_DIR
        // Para que esto funcione de forma segura, oldVideoUrl debería ser relativo a UPLOAD_DIR o solo el nombre del archivo.
        // Mejor aún, construir el path absoluto a partir de una base conocida y el nombre del archivo.
        // const videoPath = path.join(__dirname, '../../public', oldVideoUrl); // Si oldVideoUrl es /public/uploads/com_media/video.mp4
        if (fs.existsSync(videoPath)) { // Esta comprobación es crucial
          try { fs.unlinkSync(videoPath); } catch (err) { request.log.error('Error al eliminar archivo de video antiguo:', err); }
        }
      }
      if (oldImageUrl) {
        const imagePath = path.join(UPLOAD_DIR, path.basename(oldImageUrl));
        // const imagePath = path.join(__dirname, '../../public', oldImageUrl);
         if (fs.existsSync(imagePath)) {
          try { fs.unlinkSync(imagePath); } catch (err) { request.log.error('Error al eliminar archivo de imagen antiguo:', err); }
        }
      }

      reply.status(204).send();
    } finally {
      connection.release();
    }
  } catch (error) {
    request.log.error({ message: "Error en deleteComEntry", params: request.params, error: error.message, stack: error.stack });
    reply.status(500).send({ error: 'Error al eliminar la entrada de comunicación' });
  }
}

module.exports = {
  createComEntry,
  getAllComEntries,
  getComEntryById,
  updateComEntry,
  deleteComEntry
}; 