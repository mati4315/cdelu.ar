const imageExtractor = require('../src/services/imageExtractor');
const Parser = require('rss-parser');
const fs = require('fs');
const axios = require('axios');

(async () => {
    const feed = await new Parser().parseURL('https://lacalle.com.ar/feed/');
    const results = [];
    console.log('Checking items...');
    for (const item of feed.items.slice(0, 10)) {
        try {
            const res = await axios.head(item.link, { timeout: 3000 });
            if (res.status === 200) {
                const thumb = await imageExtractor.extractThumbnailOnly(item);
                results.push({ title: item.title, link: item.link, thumb });
            } else {
                console.log('SKIP (404):', item.link);
            }
        } catch (e) {
            console.log('SKIP (ERR):', item.link);
        }
    }
    fs.writeFileSync('tmp/test-results-good.json', JSON.stringify(results, null, 2));
    console.log('Done.');
})();
