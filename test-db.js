require('dotenv').config();
const pool = require('./src/config/database');
async function run() {
  try {
    const [rows] = await pool.query('SHOW TABLES LIKE "ads"');
    if (rows.length === 0) {
      console.log("Table ads not found. Creating...");
      const createSql = `
      CREATE TABLE ads (
        id INT AUTO_INCREMENT PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        descripcion TEXT,
        image_url VARCHAR(500),
        enlace_destino VARCHAR(500) NOT NULL,
        texto_opcional VARCHAR(255),
        categoria VARCHAR(50) DEFAULT 'general',
        prioridad INT DEFAULT 1,
        activo BOOLEAN DEFAULT TRUE,
        impresiones_maximas INT DEFAULT 0,
        impresiones_actuales INT DEFAULT 0,
        clics_count INT DEFAULT 0,
        created_by INT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )`;
      await pool.query(createSql);
      console.log("Table ads created successfully");
    } else {
      console.log("Table ads already exists");
    }
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
