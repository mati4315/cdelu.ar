const pool = require('./src/config/database');

async function test() {
  try {
    const [lott] = await pool.query('SELECT * FROM lotteries LIMIT 1');
    console.log("Lotteries:", lott[0] ? Object.keys(lott[0]) : "empty");
    const [tix] = await pool.query('SELECT * FROM lottery_tickets LIMIT 1');
    console.log("Tickets:", tix[0] ? Object.keys(tix[0]) : "empty");
  } catch (e) {
    console.log("Error:", e.message);
  } finally {
    process.exit();
  }
}
test();
