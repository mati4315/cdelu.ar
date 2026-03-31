#!/usr/bin/env node
/**
 * Verifica los datos guardados en la BD
 */

const mysql = require('mysql2/promise');

(async () => {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'trigamer_diario',
    waitForConnections: true,
    connectionLimit: 1,
    queueLimit: 0
  });

  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.query(
      'SELECT id, titulo, image_url, published_at, is_oficial, created_by FROM news WHERE id >= 1345 ORDER BY id DESC LIMIT 3'
    );
    conn.release();
    
    console.log('📊 Últimas 3 noticias guardadas:\n');
    rows.forEach(row => {
      console.log(`ID: ${row.id}`);
      console.log(`  Título: ${row.titulo}`);
      console.log(`  Image URL: ${row.image_url}`);
      console.log(`  Published At: ${row.published_at}`);
      console.log(`  Oficial: ${row.is_oficial}`);
      console.log(`  Created By: ${row.created_by}\n`);
    });
    
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
