/*
  Aplica índices recomendados de rendimiento de forma idempotente.
  - Verifica existencia en information_schema.STATISTICS
  - Crea índices sólo si no existen
*/
const pool = require('../config/database');

/**
 * Verifica si un índice existe en una tabla
 * @param {string} tableName
 * @param {string} indexName
 */
async function indexExists(tableName, indexName) {
  const [rows] = await pool.query(
    `SELECT 1 FROM information_schema.STATISTICS 
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ? 
     LIMIT 1`,
    [tableName, indexName]
  );
  return rows.length > 0;
}

/**
 * Ejecuta una sentencia de creación de índice si no existe
 * @param {string} tableName
 * @param {string} indexName
 * @param {string} createSql SQL completo para crear índice
 */
async function ensureIndex(tableName, indexName, createSql) {
  const exists = await indexExists(tableName, indexName);
  if (exists) {
    console.log(`✓ Índice ya existe: ${indexName} en ${tableName}`);
    return false;
  }
  console.log(`→ Creando índice: ${indexName} en ${tableName}`);
  await pool.query(createSql);
  console.log(`✓ Índice creado: ${indexName}`);
  return true;
}

async function main() {
  try {
    let created = 0;
    // news
    created += (await ensureIndex(
      'news',
      'idx_news_created_at',
      'CREATE INDEX idx_news_created_at ON news (created_at DESC)'
    )) ? 1 : 0;
    created += (await ensureIndex(
      'news',
      'idx_news_created_by',
      'CREATE INDEX idx_news_created_by ON news (created_by)'
    )) ? 1 : 0;

    // likes
    created += (await ensureIndex(
      'likes',
      'idx_likes_user_news',
      'CREATE UNIQUE INDEX idx_likes_user_news ON likes (user_id, news_id)'
    )) ? 1 : 0;
    created += (await ensureIndex(
      'likes',
      'idx_likes_news',
      'CREATE INDEX idx_likes_news ON likes (news_id)'
    )) ? 1 : 0;

    // comments
    created += (await ensureIndex(
      'comments',
      'idx_comments_news_created',
      'CREATE INDEX idx_comments_news_created ON comments (news_id, created_at DESC)'
    )) ? 1 : 0;

    // users
    created += (await ensureIndex(
      'users',
      'idx_users_email',
      'CREATE UNIQUE INDEX idx_users_email ON users (email)'
    )) ? 1 : 0;

    console.log(`\nResumen: ${created} índices creados, el resto ya existían.`);
    process.exit(0);
  } catch (err) {
    console.error('Error aplicando índices:', err && err.message ? err.message : err);
    process.exit(1);
  }
}

main();


