const pool = require('../config/database');

/**
 * Elimina todas las noticias, likes y comentarios de la base de datos.
 */
async function deleteAllNews() {
  try {
    console.log('Iniciando eliminación de todas las noticias...');
    // Desactivar temporalmente las restricciones de clave foránea
    await pool.query('SET FOREIGN_KEY_CHECKS = 0');

    console.log('Truncando tabla comments...');
    await pool.query('TRUNCATE TABLE comments');

    console.log('Truncando tabla likes...');
    await pool.query('TRUNCATE TABLE likes');

    console.log('Truncando tabla news...');
    await pool.query('TRUNCATE TABLE news');

    // Reactivar restricciones de clave foránea
    await pool.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('Todas las noticias, likes y comentarios han sido eliminados exitosamente.');
  } catch (error) {
    console.error('Error al eliminar noticias:', error);
  } finally {
    // Cerrar la conexión a la base de datos
    await pool.end();
  }
}

// Ejecutar la función
deleteAllNews(); 