const Parser = require('rss-parser');
const parser = new Parser();

(async () => {
    try {
        const feed = await parser.parseURL('https://lacalle.com.ar/feed/');
        console.log('Title:', feed.title);
        feed.items.slice(0, 3).forEach(item => {
            console.log('Title:', item.title);
            console.log('Link:', item.link);
        });
    } catch (err) {
        console.error('Error:', err.message);
    }
})();
