const pool = require('../config/database'); // Ajusta la ruta si es diferente
const fs = require('node:fs');
const util = require('node:util');
const path = require('node:path');
// const pipeline = util.promisify(require('node:stream').pipeline); // Ya no usamos pipeline directamente aquí

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
 * Guarda un archivo subido y retorna su ruta relativa.
 * @param {object} fileData - El objeto de archivo de fastify-multipart (request.body.fileField).
 * @param {string} destinationDir - El directorio donde guardar el archivo.
 * @param {number} [maxIndividualFileSize] - Tamaño máximo permitido para este archivo en bytes.
 * @returns {Promise<string|null>} La ruta relativa del archivo guardado o null si no hay archivo.
 * @throws {Error} Si el archivo guardado excede maxIndividualFileSize o si hay un error al guardar.
 */
async function saveFile(fileData, destinationDir, maxIndividualFileSize) {
  console.log(`[saveFile] Iniciando guardado para: ${fileData ? fileData.filename : 'archivo desconocido'}`);

  if (!fileData || !fileData.filename) { 
    console.error('[saveFile] Error: fileData no válido o sin filename.');
    return null;
  }

  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const extension = path.extname(fileData.filename) || '';
  const filename = fileData.fieldname + '-' + uniqueSuffix + extension;
  const filePath = path.join(destinationDir, filename);
  const publicFilePath = path.join('/public/uploads/com_media', filename).replace(/\\/g, '/');

  try {
    if (fileData._buf && fileData._buf instanceof Buffer) {
      console.log(`[saveFile] Escribiendo desde buffer interno (_buf) para ${fileData.filename}.`);
      fs.writeFileSync(filePath, fileData._buf);
    } else if (fileData.file && fileData.file.readable) { 
      // Este caso es menos probable ahora, pero se mantiene como fallback
      console.log(`[saveFile] Escribiendo desde stream (fileData.file) para ${fileData.filename}.`);
      await new Promise((resolve, reject) => {
        const inputStream = fileData.file;
        const outputStream = fs.createWriteStream(filePath);
        inputStream.on('error', reject); // Simplificado
        outputStream.on('error', reject); // Simplificado
        outputStream.on('finish', resolve); // Simplificado
        inputStream.pipe(outputStream);
      });
    } else {
      console.error(`[saveFile] Error: No hay buffer (_buf) ni stream de archivo (fileData.file) leíble para ${fileData.filename}.`);
      throw new Error(`No se pudo obtener el contenido del archivo para ${fileData.filename}.`);
    }

    const stats = fs.statSync(filePath);
    console.log(`[saveFile] Archivo ${filename} guardado, tamaño: ${stats.size} bytes.`);

    if (stats.size === 0) {
      console.warn(`[saveFile] ADVERTENCIA: El archivo ${filename} se guardó con 0 bytes.`);
      try { fs.unlinkSync(filePath); } catch (e) { console.error('Error al eliminar archivo de 0KB', e); }
      throw new Error(`El archivo ${fileData.filename} se procesó pero resultó en 0 bytes.`);
    }

    if (maxIndividualFileSize && stats.size > maxIndividualFileSize) {
      console.error(`[saveFile] Error: Archivo ${filename} (${stats.size} bytes) excede el límite de ${maxIndividualFileSize} bytes.`);
      fs.unlinkSync(filePath);
      throw new Error(`El archivo ${fileData.filename} excede el límite de tamaño.`);
    }
    return publicFilePath;

  } catch (err) {
    console.error(`[saveFile] Falla al procesar ${fileData.filename}: ${err.message}`);
    if (fs.existsSync(filePath)) {
       try {
         fs.unlinkSync(filePath);
       } catch (unlinkErr) {
         console.error('[saveFile] Falla al eliminar archivo tras error:', unlinkErr);
       }
    }
    throw err; // Re-lanzar el error para que createComEntry lo maneje
  }
}

/**
 * Crea una nueva entrada de comunicación (com).
 * @param {FastifyRequest} request - La solicitud de Fastify.
 * @param {FastifyReply} reply - La respuesta de Fastify.
 */
async function createComEntry(request, reply) {
  // Loguear solo la presencia y nombres de archivos/campos principales
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

  try {
    if (videoFile) {
      videoUrl = await saveFile(videoFile, UPLOAD_DIR, MAX_VIDEO_SIZE_BYTES);
    }
    
    if (imageFiles.length > 0) {
      if (imageFiles.length > MAX_IMAGES_COUNT) {
        return reply.status(400).send({ error: `No puede subir más de ${MAX_IMAGES_COUNT} imágenes.` });
      }
      for (const imageFile of imageFiles) {
        const singleImageUrl = await saveFile(imageFile, UPLOAD_DIR, MAX_IMAGE_SIZE_BYTES_PER_FILE);
        if (singleImageUrl) {
          imageUrls.push(singleImageUrl);
        }
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
        [titulo, descripcion, userId, videoUrl, imageUrlJsonToDb]
      );
      
      const [rows] = await connection.execute('SELECT * FROM com WHERE id = ?', [result.insertId]);
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
      reply.status(201).send(createdEntry);
    } finally {
      connection.release();
    }
  } catch (error) {
    const errorDetails = error instanceof Error ? { message: error.message, name: error.name } : { message: String(error) }; // No incluir stack en prod por defecto
    request.log.error('Error en createComEntry:', errorDetails);
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