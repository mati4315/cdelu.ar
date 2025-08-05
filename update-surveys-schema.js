const pool = require('./src/config/database');

async function updateSurveysSchema() {
  console.log('🔧 Actualizando esquema de la tabla surveys...');
  
  try {
    // 1. Verificar estructura actual
    console.log('1️⃣ Verificando estructura actual...');
    const [columns] = await pool.execute('DESCRIBE surveys');
    console.log('Columnas actuales:');
    columns.forEach(col => {
      console.log(`   - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    // 2. Eliminar columnas title y description
    console.log('\n2️⃣ Eliminando columnas title y description...');
    
    try {
      await pool.execute('ALTER TABLE surveys DROP COLUMN title');
      console.log('✅ Columna title eliminada');
    } catch (error) {
      if (error.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
        console.log('⚠️ Columna title no existe o no se puede eliminar');
      } else {
        console.log('❌ Error eliminando title:', error.message);
      }
    }
    
    try {
      await pool.execute('ALTER TABLE surveys DROP COLUMN description');
      console.log('✅ Columna description eliminada');
    } catch (error) {
      if (error.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
        console.log('⚠️ Columna description no existe o no se puede eliminar');
      } else {
        console.log('❌ Error eliminando description:', error.message);
      }
    }
    
    // 3. Verificar estructura final
    console.log('\n3️⃣ Verificando estructura final...');
    const [finalColumns] = await pool.execute('DESCRIBE surveys');
    console.log('Columnas finales:');
    finalColumns.forEach(col => {
      console.log(`   - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    // 4. Verificar datos existentes
    console.log('\n4️⃣ Verificando datos existentes...');
    const [surveys] = await pool.execute('SELECT * FROM surveys LIMIT 3');
    console.log(`Encuestas encontradas: ${surveys.length}`);
    
    if (surveys.length > 0) {
      console.log('Ejemplo de encuesta:');
      const survey = surveys[0];
      Object.keys(survey).forEach(key => {
        console.log(`   - ${key}: ${survey[key]}`);
      });
    }
    
    console.log('\n✅ Esquema actualizado exitosamente');
    
  } catch (error) {
    console.error('❌ Error actualizando esquema:', error.message);
  } finally {
    await pool.end();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  updateSurveysSchema()
    .then(() => {
      console.log('\n🎉 Actualización de esquema completada');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Error inesperado:', error);
      process.exit(1);
    });
}

module.exports = updateSurveysSchema; 