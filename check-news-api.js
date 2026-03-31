const fetch = require('node-fetch');

async function checkNewsAPI() {
  try {
    console.log('🔍 Haciendo petición a /api/v1/news...\n');
    
    const response = await fetch('http://localhost:3001/api/v1/news?page=1&limit=5');
    const data = await response.json();
    
    console.log('✅ Respuesta recibida:\n');
    
    if (data.data && data.data.length > 0) {
      // Mostrar los primeros 5 artículos
      data.data.forEach((news, index) => {
        console.log(`\n───────────────────────────────────────`);
        console.log(`📰 Noticia ${index + 1}: ${news.titulo}`);
        console.log(`───────────────────────────────────────`);
        console.log(`ID: ${news.id}`);
        console.log(`image_url: ${news.image_url || '(vacío)'}`);
        console.log(`image_thumbnail_url: ${news.image_thumbnail_url || '(vacío)'}`);
        console.log(`diario: ${news.diario || '(vacío)'}`);
        console.log(`categoria: ${news.categoria || '(vacío)'}`);
        console.log(`likes_count: ${news.likes_count}`);
        console.log(`comments_count: ${news.comments_count}`);
      });
      
      console.log(`\n───────────────────────────────────────`);
      console.log(`\n📊 Paginación:`);
      console.log(`Total: ${data.pagination.total}`);
      console.log(`Página: ${data.pagination.page}`);
      console.log(`Por página: ${data.pagination.limit}`);
      console.log(`Total de páginas: ${data.pagination.totalPages}`);
      
    } else {
      console.log('⚠️  No hay noticias en la API');
    }
    
  } catch (error) {
    console.error('❌ Error al llamar la API:', error.message);
  }
}

checkNewsAPI();
