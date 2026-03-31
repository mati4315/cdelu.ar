const axios = require('axios');
const fs = require('fs');
(async () => {
    try {
        const r = await axios.get('https://lacalle.com.ar/el-nunca-mas-es-hoy/', { headers: { 'User-Agent': 'Mozilla/5.0' } });
        fs.writeFileSync('tmp/head.html', r.data.substring(0, 10000));
        console.log('Success');
    } catch (e) { console.error(e.message); }
})();
