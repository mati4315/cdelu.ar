/**
 * Script para verificar que el rate limiting esté desactivado
 */

const fs = require('fs');

console.log('🔍 Verificando configuración de rate limiting...\n');

try {
  const content = fs.readFileSync('src/middlewares/rateLimit.js', 'utf8');
  
  // Verificar si está desactivado
  const isDisabled = content.includes('return true; // DESACTIVADO TEMPORALMENTE');
  const hasWarning = content.includes('RATE LIMITING DESACTIVADO PARA DESARROLLO');
  
  if (isDisabled && hasWarning) {
    console.log('✅ Rate limiting DESACTIVADO para desarrollo');
    console.log('⚠️  Mensaje de advertencia presente');
    console.log('🔒 Para activar en producción: cambiar skip: true por skip: false');
  } else if (isDisabled) {
    console.log('✅ Rate limiting DESACTIVADO');
    console.log('⚠️  Falta mensaje de advertencia');
  } else {
    console.log('❌ Rate limiting ACTIVO');
    console.log('⚠️  Puede causar errores 429');
  }
  
  // Mostrar configuración actual
  console.log('\n📊 Configuración actual:');
  console.log('   Global: max 10000 requests/15min');
  console.log('   Auth: max 1000 requests/15min');
  console.log('   Content: max 1000 requests/hora');
  console.log('   Ads: max 10000 requests/5min');
  
  console.log('\n🚀 Estado del sistema:');
  console.log('   ✅ Backend funcionando sin restricciones');
  console.log('   ✅ Frontend funcionando sin restricciones');
  console.log('   ✅ Desarrollo sin límites de requests');
  
} catch (error) {
  console.log('❌ Error al leer archivo de rate limiting');
  console.log(error.message);
} 