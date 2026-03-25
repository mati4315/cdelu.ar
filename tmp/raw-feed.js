const axios = require('axios');
(async () => {
    try {
        const res = await axios.get('https://lacalle.com.ar/feed/');
        console.log(res.data.substring(0, 5000));
    } catch (e) {
        console.error('Error:', e.message);
    }
})();
