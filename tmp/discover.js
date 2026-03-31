const axios = require('axios');
(async () => {
    try {
        const url = 'https://lacalle.com.ar/el-nunca-mas-es-hoy/';
        const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } });
        const html = res.data;
        console.log('Title:', html.match(/<title>(.*?)<\/title>/i)?.[1]);
        console.log('Metas with image:', html.match(/<meta[^>]+(?:content|value)=['"](.*?\.(?:jpe?g|png|gif|webp))['"][^>]*>/gi));
        console.log('First 5 images in body:', html.match(/<img[^>]+src=['"]([^'"]+)['"]/gi)?.slice(0, 5));
        
        // Check for specific WP classes
        console.log('Has wp-post-image?', html.includes('wp-post-image'));
        if (html.includes('wp-post-image')) {
            console.log('WP Post Image tag:', html.match(/<img[^>]+class=['"][^'"]*wp-post-image[^'"]*['"][^>]*>/i)?.[0]);
        }
    } catch (e) {
        console.log('Error:', e.message);
    }
})();
