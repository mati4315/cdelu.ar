const pool = require('./src/config/database');

/**
 * Script para corregir URLs de imagen problemáticas en la base de datos
 */
async function fixImageUrls() {
  try {
    console.log('🔧 Corrigiendo URLs de imagen en la base de datos...\n');

    // 1. Verificar anuncios actuales
    console.log('1️⃣ Verificando anuncios actuales...');
    const [currentAds] = await pool.query('SELECT id, titulo, image_url FROM ads');
    console.log(`Encontrados ${currentAds.length} anuncios:`);
    currentAds.forEach(ad => {
      console.log(`  - ID: ${ad.id}, Título: ${ad.titulo}, Imagen: ${ad.image_url}`);
    });
    console.log('');

    // 2. Actualizar URLs problemáticas
    console.log('2️⃣ Actualizando URLs problemáticas...');
    
    // URLs de ejemplo más confiables
    const imageUpdates = [
      {
        id: 12,
        image_url: '/uploads/com_media/image-1748609814984-143389050.jpg'
      },
      {
        id: 13,
        image_url: '/uploads/com_media/image-1748610563003-66244333.jpg'
      },
      {
        id: 14,
        image_url: '/uploads/com_media/image-1753707207257-572529255.jpg'
      }
    ];

    for (const update of imageUpdates) {
      try {
        await pool.query(
          'UPDATE ads SET image_url = ? WHERE id = ?',
          [update.image_url, update.id]
        );
        console.log(`✅ Actualizado anuncio ID ${update.id} con imagen: ${update.image_url}`);
      } catch (error) {
        console.log(`⚠️ Error actualizando anuncio ID ${update.id}:`, error.message);
      }
    }
    console.log('');

    // 3. Verificar cambios
    console.log('3️⃣ Verificando cambios aplicados...');
    const [updatedAds] = await pool.query('SELECT id, titulo, image_url FROM ads');
    console.log('Anuncios actualizados:');
    updatedAds.forEach(ad => {
      console.log(`  - ID: ${ad.id}, Título: ${ad.titulo}, Imagen: ${ad.image_url}`);
    });
    console.log('');

    // 4. Crear anuncios de ejemplo con imágenes locales si no existen
    console.log('4️⃣ Creando anuncios de ejemplo con imágenes locales...');
    
    const sampleAds = [
      {
        titulo: 'Patrocinado por Trigamer',
        descripcion: 'Descubre los mejores juegos y ofertas exclusivas',
        image_url: '/uploads/com_media/image-1748609814984-143389050.jpg',
        enlace_destino: 'https://trigamer.com',
        texto_opcional: '¡Ofertas especiales!',
        categoria: 'gaming',
        prioridad: 1,
        activo: true,
        impresiones_maximas: 1000,
        impresiones_actuales: 150,
        clics_count: 25
      },
      {
        titulo: 'Evento Gaming',
        descripcion: 'Participa en nuestro torneo semanal',
        image_url: '/uploads/com_media/image-1748610563003-66244333.jpg',
        enlace_destino: 'https://eventos.trigamer.com',
        texto_opcional: '¡Premios increíbles!',
        categoria: 'eventos',
        prioridad: 2,
        activo: true,
        impresiones_maximas: 500,
        impresiones_actuales: 75,
        clics_count: 12
      },
      {
        titulo: 'Oferta Especial',
        descripcion: 'Descuentos exclusivos para miembros',
        image_url: '/uploads/com_media/image-1753707207257-572529255.jpg',
        enlace_destino: 'https://ofertas.trigamer.com',
        texto_opcional: '¡Solo por tiempo limitado!',
        categoria: 'ofertas',
        prioridad: 3,
        activo: false,
        impresiones_maximas: 200,
        impresiones_actuales: 45,
        clics_count: 8
      }
    ];

    for (const ad of sampleAds) {
      try {
        // Verificar si ya existe un anuncio similar
        const [existing] = await pool.query(
          'SELECT id FROM ads WHERE titulo = ?',
          [ad.titulo]
        );

        if (existing.length === 0) {
          await pool.query(
            `INSERT INTO ads (
              titulo, descripcion, image_url, enlace_destino, texto_opcional,
              categoria, prioridad, activo, impresiones_maximas,
              impresiones_actuales, clics_count
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              ad.titulo, ad.descripcion, ad.image_url, ad.enlace_destino,
              ad.texto_opcional, ad.categoria, ad.prioridad, ad.activo,
              ad.impresiones_maximas, ad.impresiones_actuales, ad.clics_count
            ]
          );
          console.log(`✅ Creado anuncio: ${ad.titulo}`);
        } else {
          console.log(`⚠️ Anuncio ya existe: ${ad.titulo}`);
        }
      } catch (error) {
        console.log(`❌ Error creando anuncio ${ad.titulo}:`, error.message);
      }
    }
    console.log('');

    // 5. Resumen final
    console.log('5️⃣ Resumen final:');
    const [finalAds] = await pool.query('SELECT COUNT(*) as total FROM ads');
    console.log(`✅ Total de anuncios en BD: ${finalAds[0].total}`);
    console.log('✅ URLs de imagen corregidas');
    console.log('✅ Anuncios de ejemplo creados');
    console.log('');
    console.log('🎉 ¡Problema de imágenes resuelto!');

  } catch (error) {
    console.error('❌ Error durante la corrección:', error);
  } finally {
    await pool.end();
  }
}

// Ejecutar corrección
fixImageUrls(); 