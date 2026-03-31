const mysql = require('mysql2/promise');
require('dotenv').config();

const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'trigamer_diario'
};

async function checkSchema() {
  const connection = await mysql.createConnection(config);
  try {
    const [newsFields] = await connection.query('DESCRIBE news');
    const [comFields] = await connection.query('DESCRIBE com');
    const [feedFields] = await connection.query('DESCRIBE content_feed');
    
    let adsFields = [];
    try {
        [adsFields] = await connection.query('DESCRIBE ads');
    } catch (e) {
        // ignore
    }

    console.log(JSON.stringify({
        news: newsFields,
        com: comFields,
        content_feed: feedFields,
        ads: adsFields
    }, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

checkSchema();
