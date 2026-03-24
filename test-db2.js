require('dotenv').config();
const pool = require('./src/config/database');
async function run() {
  try {
    const [rows] = await pool.query('SHOW TABLES LIKE "lotteries"');
    if (rows.length === 0) {
      console.log("Table lotteries not found.");
    } else {
      console.log("Table lotteries exists");
    }
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
