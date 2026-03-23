const pool = require('./src/config/database');
async function main() {
  try {
    const [columns] = await pool.execute('DESCRIBE users');
    console.log('COLUMNS_START');
    console.log(JSON.stringify(columns, null, 2));
    console.log('COLUMNS_END');
    
    const [users] = await pool.execute('SELECT * FROM users LIMIT 1');
    console.log('USERS_START');
    console.log(JSON.stringify(users, null, 2));
    console.log('USERS_END');
  } catch(e) {
    console.error('ERROR_START');
    console.error(e);
    console.error('ERROR_END');
  } finally {
    await pool.end();
  }
}
main();
