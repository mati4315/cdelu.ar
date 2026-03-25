const axios = require('axios');
(async () => {
    try {
        const url = 'https://lacalle.com.ar/nadadores-uruguayenses-se-animaron-al-mar-en-punta-del-este/';
        const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' } });
        const head = res.data.match(/<head>([\s\S]*?)<\/head>/i);
        if (head) {
             console.log(head[1].substring(0, 10000));
        } else {
             console.log('HEAD NOT FOUND');
        }
    } catch (e) {
        console.log('Error:', e.message);
    }
})();
