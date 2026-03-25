const Parser = require('rss-parser');
const parser = new Parser();
(async () => {
    try {
        const feed = await parser.parseURL('https://lacalle.com.ar/feed/');
        feed.items.slice(0, 5).forEach((item, i) => {
            console.log(`[${i}] Title: ${item.title}`);
            console.log(`    Link: ${item.link}`);
        });
    } catch (e) {
        console.error('Error:', e.message);
    }
})();
