/**
 * Script para debuggear la API de usuarios
 */

require('dotenv').config();

async function debugUserAPI() {
  try {
    const repository = require('./src/features/users/users.repository');
    
    console.log('🔍 Probando repository directamente...\n');
    
    // Probar búsqueda por username
    console.log('1. Buscando usuario por username "administrador.1"...');
    const user = await repository.findByUsername('administrador.1');
    console.log('Resultado:', user);
    
    if (!user) {
      console.log('\n🔍 Listando todos los usuarios disponibles:');
      const pool = require('./src/config/database');
      const [allUsers] = await pool.execute('SELECT id, nombre, username FROM users LIMIT 10');
      console.table(allUsers);
    }
    
    // Probar servicio
    console.log('\n2. Probando servicio...');
    const service = require('./src/features/users/users.service');
    
    try {
      const profile = await service.getPublicProfile('administrador.1');
      console.log('Profile resultado:', profile);
    } catch (error) {
      console.error('Error en servicio:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

debugUserAPI();
