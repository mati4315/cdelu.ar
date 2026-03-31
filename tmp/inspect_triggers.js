const path = require('path');
const dbPath = path.resolve(__dirname, '../src/config/database');
const pool = require(dbPath);

async function checkTriggers() {
    try {
        const [rows] = await pool.query("SHOW TRIGGERS LIKE 'news'");
        console.log(`Encontrados ${rows.length} triggers en la tabla news.`);
        
        for (const trg of rows) {
            const [createTrg] = await pool.query(`SHOW CREATE TRIGGER \`${trg.Trigger}\``);
            console.log("\n--- TRIGGER:", trg.Trigger, "---");
            console.log(createTrg[0]['Create Trigger']);
        }
        process.exit(0);
    } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
    }
}

checkTriggers();
