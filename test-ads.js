require('dotenv').config();
const repo = require('./src/features/ads/ads.repository');

async function testAds() {
  try {
    console.log("Testing Ads API Repo...");
    // Count ads
    let stats = await repo.fetchStats();
    console.log("Stats before:", stats);
    
    // Insert dummy ad
    const newId = await repo.insertAd({
      titulo: 'Test Ad',
      descripcion: 'Testing insertion',
      image_url: 'https://via.placeholder.com/150',
      enlace_destino: 'https://example.com',
      texto_opcional: '',
      categoria: 'general',
      prioridad: 5,
      activo: true,
      impresiones_maximas: 1000,
      created_by: 1
    });
    console.log("Inserted new Ad with ID:", newId);
    
    // Count ads again
    stats = await repo.fetchStats();
    console.log("Stats after:", stats);
    
    process.exit(0);
  } catch (err) {
    console.error("Error testing ads:", err);
    process.exit(1);
  }
}
testAds();
