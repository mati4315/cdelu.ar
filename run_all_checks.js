const { execSync } = require('child_process');
const scripts = ['check-survey-status.js', 'check-survey-triggers.js', 'check-lottery-tables.js', 'check-lottery-tickets.js'];
let failed = false;

for (const s of scripts) {
  try {
    console.log(`\n--- Running ${s} ---`);
    const out = execSync(`node ${s}`).toString();
    if (out.includes('❌') || out.includes('Error')) {
      console.log(`Found possible issues in ${s}:\n`, out);
      failed = true;
    } else {
      console.log(`✅ ${s} passed successfully.`);
    }
  } catch (e) {
    failed = true;
    console.log(`\n--- FAILED ${s} ---`);
    console.log(e.stdout ? e.stdout.toString() : e.message);
  }
}

if (failed) {
  console.log('\n❌ Some checks failed.');
  process.exit(1);
} else {
  console.log('\n🎉 All checks passed.');
}
