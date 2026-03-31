require('dotenv').config();
const pool = require('./src/config/database');

async function checkTables() {
  try {
    const [tables] = await pool.query('SHOW TABLES');
    console.log('--- TABLES IN DATABASE ---');
    for (const tableRow of tables) {
      const tableName = Object.values(tableRow)[0];
      console.log(`\nTable: ${tableName}`);
      const [columns] = await pool.query(`DESCRIBE ${tableName}`);
      columns.forEach(col => {
        console.log(`  - ${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'NULL' : 'NOT NULL'})`);
      });
    }
  } catch (error) {
    console.error('Error checking tables:', error);
  } finally {
    process.exit(0);
  }
}

checkTables();
