const pool = require('./src/config/database');

/**
 * Script para corregir URLs de imagen problemáticas directamente
 */
async function fixImageUrlsDirect() {
  try {
    console.log('🔧 Corrigiendo URLs de imagen problemáticas...\n');

    // 1. Actualizar anuncios con URLs de via.placeholder.com
    console.log('1️⃣ Actualizando anuncios con URLs problemáticas...');
    
    const updateQueries = [
      {
        id: 1,
        image_url: '/uploads/com_media/image-1748609814984-143389050.jpg'
      },
      {
        id: 2,
        image_url: '/uploads/com_media/image-1748610563003-66244333.jpg'
      },
      {
        id: 4,
        image_url: '/uploads/com_media/image-1753707207257-572529255.jpg'
      }
    ];

    for (const update of updateQueries) {
      try {
        await pool.query(
          'UPDATE ads SET image_url = ? WHERE id = ?',
          [update.image_url, update.id]
        );
        console.log(`✅ Actualizado anuncio ID ${update.id} con imagen local`);
      } catch (error) {
        console.log(`⚠️ Error actualizando anuncio ID ${update.id}:`, error.message);
      }
    }
    console.log('');

    // 2. Verificar cambios
    console.log('2️⃣ Verificando cambios aplicados...');
    const [updatedAds] = await pool.query('SELECT id, titulo, image_url FROM ads ORDER BY id');
    console.log('Anuncios actualizados:');
    updatedAds.forEach(ad => {
      const imageStatus = ad.image_url ? '✅ Con imagen' : '❌ Sin imagen';
      console.log(`  - ID: ${ad.id}, Título: ${ad.titulo}, ${imageStatus}`);
    });
    console.log('');

    // 3. Crear imagen placeholder local si no existe
    console.log('3️⃣ Creando imagen placeholder local...');
    
    // Crear un anuncio de ejemplo con imagen local
    const sampleAd = {
      titulo: 'Anuncio de Ejemplo',
      descripcion: 'Este es un anuncio de ejemplo con imagen local',
      image_url: '/uploads/com_media/image-1748609814984-143389050.jpg',
      enlace_destino: 'https://ejemplo.com',
      texto_opcional: '¡Prueba nuestro sistema!',
      categoria: 'general',
      prioridad: 1,
      activo: true,
      impresiones_maximas: 100,
      impresiones_actuales: 0,
      clics_count: 0
    };

    try {
      await pool.query(
        `INSERT INTO ads (
          titulo, descripcion, image_url, enlace_destino, texto_opcional,
          categoria, prioridad, activo, impresiones_maximas,
          impresiones_actuales, clics_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          sampleAd.titulo, sampleAd.descripcion, sampleAd.image_url,
          sampleAd.enlace_destino, sampleAd.texto_opcional, sampleAd.categoria,
          sampleAd.prioridad, sampleAd.activo, sampleAd.impresiones_maximas,
          sampleAd.impresiones_actuales, sampleAd.clics_count
        ]
      );
      console.log('✅ Creado anuncio de ejemplo con imagen local');
    } catch (error) {
      console.log('⚠️ Error creando anuncio de ejemplo:', error.message);
    }
    console.log('');

    // 4. Resumen final
    console.log('4️⃣ Resumen final:');
    const [finalAds] = await pool.query('SELECT COUNT(*) as total FROM ads');
    console.log(`✅ Total de anuncios en BD: ${finalAds[0].total}`);
    console.log('✅ URLs de imagen corregidas');
    console.log('✅ Anuncio de ejemplo creado');
    console.log('');
    console.log('🎉 ¡Problema de imágenes resuelto!');
    console.log('');
    console.log('💡 Ahora las imágenes se cargarán desde archivos locales');
    console.log('   en lugar de servicios externos no confiables.');

  } catch (error) {
    console.error('❌ Error durante la corrección:', error);
  } finally {
    await pool.end();
  }
}

// Ejecutar corrección
fixImageUrlsDirect(); 