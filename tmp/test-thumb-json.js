const imageExtractor = require('../src/services/imageExtractor');
const Parser = require('rss-parser');
const fs = require('fs');

(async () => {
    const feed = await new Parser().parseURL('https://lacalle.com.ar/feed/');
    const results = [];
    for (const item of feed.items.slice(0, 3)) {
        const thumb = await imageExtractor.extractThumbnailOnly(item);
        results.push({ title: item.title, thumb });
    }
    fs.writeFileSync('tmp/test-results.json', JSON.stringify(results, null, 2));
    console.log('Results written to tmp/test-results.json');
})();
