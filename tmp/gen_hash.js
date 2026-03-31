const bcrypt = require('bcryptjs');
const psw = '@35115415';
const hash = bcrypt.hashSync(psw, 10);
console.log('Password:', psw);
console.log('Hash:', hash);
console.log('Verification:', bcrypt.compareSync(psw, hash));
