const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const rssService = require('../src/services/rssService');

async function test() {
    console.log('Testing Preview RSS with improved image extraction...');
    try {
        const news = await rssService.previewRSSNews();
        console.log(`Found ${news.length} items.`);
        news.forEach((item, i) => {
            console.log(`[${i}] ${item.title}`);
            console.log(`    Image: ${item.image_url || 'MISSING'}`);
            console.log(`    Link: ${item.original_url}`);
            console.log('---');
        });
    } catch (err) {
        console.error('Test failed:', err);
    }
}

test();
