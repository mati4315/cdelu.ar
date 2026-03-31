const axios = require('axios');
(async () => {
    try {
        const url = 'https://lacalle.com.ar/el-nunca-mas-es-hoy/';
        console.log('Fetching:', url);
        const res = await axios.get(url, { 
            timeout: 10000, 
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            } 
        });
        console.log('Status:', res.status);
        console.log('Length:', res.data.length);
        const match = res.data.match(/og:image/);
        console.log('Found og:image?', !!match);
        if (match) {
            console.log('Snippet:', res.data.substring(res.data.indexOf('og:image') - 50, res.data.indexOf('og:image') + 200));
        }
    } catch (e) {
        console.error('Error:', e.message);
        if (e.response) console.log('Response Status:', e.response.status);
    }
})();
