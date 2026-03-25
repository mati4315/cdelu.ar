const axios = require('axios');

async function test() {
    try {
        const res = await axios.get('https://lacalle.com.ar/feed/', { timeout: 10000 });
        console.log(res.data.substring(0, 5000));
    } catch (e) {
        console.error(e);
    }
}

test();
