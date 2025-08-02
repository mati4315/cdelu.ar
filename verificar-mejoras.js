const fs = require('fs');

console.log('🔍 Verificando mejoras críticas implementadas...\n');

// Verificaciones rápidas
const checks = [
  { file: 'frontend/src/router/index.ts', text: 'router.beforeEach', desc: 'Guard de autenticación' },
  { file: 'frontend/public/manifest.json', text: '"display": "standalone"', desc: 'PWA manifest' },
  { file: 'frontend/public/sw.js', text: 'Service Worker', desc: 'Service Worker' },
  { file: 'frontend/src/services/analyticsService.ts', text: 'AnalyticsService', desc: 'Analytics service' },
  { file: 'frontend/src/store/theme.ts', text: 'useThemeStore', desc: 'Tema store' },
  { file: 'src/middlewares/rateLimit.js', text: 'rateLimitConfig', desc: 'Rate limiting' },
  { file: 'src/app.js', text: 'registerRateLimit', desc: 'Rate limiting integrado' }
];

let successCount = 0;

checks.forEach(check => {
  try {
    const content = fs.readFileSync(check.file, 'utf8');
    const exists = content.includes(check.text);
    console.log(`${exists ? '✅' : '❌'} ${check.desc}`);
    if (exists) successCount++;
  } catch (error) {
    console.log(`❌ ${check.desc} - Archivo no encontrado`);
  }
});

console.log(`\n📊 Resultado: ${successCount}/${checks.length} verificaciones exitosas`);

if (successCount === checks.length) {
  console.log('\n🎉 ¡Todas las mejoras críticas han sido implementadas exitosamente!');
  console.log('\n✅ Sistema actualizado con:');
  console.log('   🔐 Autenticación Frontend');
  console.log('   📱 PWA Básica');
  console.log('   📊 Analytics Básico');
  console.log('   🎨 Tema Oscuro');
  console.log('   🔒 Rate Limiting Backend');
} else {
  console.log('\n⚠️  Algunas verificaciones fallaron. Revisar implementación.');
} 