"use strict";

/**
 * Servicio de descarga y guardado de imágenes
 * Descarga imágenes desde URLs externas y las guarda localmente
 */

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// Carpeta donde se guardan las imágenes
const UPLOADS_DIR = path.join(__dirname, '../../public/uploads');

/**
 * Asegura que el directorio de uploads existe
 */
function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

/**
 * Descarga una imagen desde URL y la guarda localmente
 * @param {string} imageUrl - URL de la imagen a descargar
 * @returns {Promise<string|null>} - Ruta local de la imagen o null si falla
 */
async function downloadAndSaveImage(imageUrl) {
  if (!imageUrl) return null;

  try {
    ensureUploadsDir();

    // Descargar la imagen
    const response = await fetch(imageUrl, {
      timeout: 10000, // timeout de 10 segundos
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      console.error(`Error descargando imagen: HTTP ${response.status}`);
      return null;
    }

    // Extraer el content-type para determinar la extensión
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const ext = getExtensionFromContentType(contentType);

    // Generar nombre de archivo único
    const filename = `img-${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
    const filepath = path.join(UPLOADS_DIR, filename);

    // Guardar la imagen
    const buffer = await response.buffer();
    fs.writeFileSync(filepath, buffer);

    console.log(`✅ Imagen guardada: ${filename}`);
    
    // Retornar ruta relativa para almacenar en BD
    return `/uploads/${filename}`;

  } catch (error) {
    console.error(`❌ Error al descargar imagen: ${error.message}`);
    return null;
  }
}

/**
 * Obtiene la extensión de archivo basada en content-type
 * @param {string} contentType
 * @returns {string}
 */
function getExtensionFromContentType(contentType) {
  const typeMap = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg'
  };
  
  return typeMap[contentType] || 'jpg';
}

module.exports = {
  downloadAndSaveImage,
  ensureUploadsDir
};
