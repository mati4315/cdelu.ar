const rss = require('./src/services/rssService');
(async () => {
  try {
    console.log('📡 Analizando feed RSS...');
    const news = await rss.previewRSSNews();
    console.log('\n📰 RESULTADOS DE EXTRACCIÓN:\n');
    news.slice(0, 15).forEach((n, i) => {
      console.log(`${i+1}. ${n.title.substring(0, 60)}...`);
      console.log(`   Imagen: ${n.image_url ? '✅ SÍ' : '❌ NO'}`);
      console.log(`   URL: ${n.image_url || 'N/A'}\n`);
    });
  } catch (e) {
    console.error('❌ Error:', e.message);
  }
})();
