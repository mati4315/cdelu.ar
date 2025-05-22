/**
 * Punto de entrada para Passenger
 * Este archivo configura límites de memoria y otras optimizaciones
 * antes de cargar la aplicación principal
 */

// Configurar límites de memoria para V8
const v8 = require('v8');
try {
  // Intentar reducir el uso de memoria del heap
  const heapSizeLimit = v8.getHeapStatistics().heap_size_limit;
  const desiredHeapSizeInBytes = 700 * 1024 * 1024; // 700MB
  
  if (heapSizeLimit > desiredHeapSizeInBytes) {
    // Solo ajustar si el límite actual es mayor que el deseado
    v8.setFlagsFromString('--max_old_space_size=700');
    console.log('Límite de memoria V8 ajustado a 700MB');
  }
  
  // Reducir tamaño del heap nuevo
  v8.setFlagsFromString('--min_semi_space_size=2');
  v8.setFlagsFromString('--max_semi_space_size=8');
  
  // Optimizar para menos memoria pero más GC
  v8.setFlagsFromString('--optimize_for_size');
  v8.setFlagsFromString('--memory_reducer');
  
  // Específico para WebAssembly
  v8.setFlagsFromString('--wasm-num-compilation-tasks=1');
  v8.setFlagsFromString('--wasm-write-protect-code-memory=false');
  v8.setFlagsFromString('--wasm-max-initial-code-space-reservation=0');
  
  console.log('Optimizaciones de memoria V8 aplicadas');
} catch (err) {
  console.error('No se pudo ajustar el límite de memoria:', err.message);
}

// Configurar manejo de excepciones no capturadas
process.on('uncaughtException', (err) => {
  console.error('Error no capturado:', err);
  // No cerrar el proceso para que Passenger pueda reiniciarlo si es necesario
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Promesa rechazada no manejada:', reason);
});

// Limitar el uso de memoria de Buffer
try {
  if (global.Buffer) {
    global.Buffer.poolSize = 8 * 1024; // 8KB en lugar del predeterminado 8MB
    console.log('Buffer poolSize reducido a 8KB');
  }
} catch (e) {
  console.error('No se pudo ajustar Buffer.poolSize:', e);
}

// Configurar intervalo de GC explícito si está disponible
if (global.gc) {
  const gcInterval = 10 * 60 * 1000; // 10 minutos
  console.log(`Configurando GC manual cada ${gcInterval/60000} minutos`);
  
  setInterval(() => {
    try {
      const memBefore = process.memoryUsage();
      global.gc();
      const memAfter = process.memoryUsage();
      
      const mbBefore = Math.round(memBefore.heapUsed / 1024 / 1024);
      const mbAfter = Math.round(memAfter.heapUsed / 1024 / 1024);
      
      console.log(`GC manual ejecutado: ${mbBefore}MB -> ${mbAfter}MB (liberado: ${mbBefore - mbAfter}MB)`);
    } catch (e) {
      console.error('Error al ejecutar GC manual:', e);
    }
  }, gcInterval);
}

// Monitorear uso de memoria
const memoryInterval = 30 * 60 * 1000; // 30 minutos
setInterval(() => {
  const mem = process.memoryUsage();
  console.log({
    rss: `${Math.round(mem.rss / 1024 / 1024)} MB`,
    heapTotal: `${Math.round(mem.heapTotal / 1024 / 1024)} MB`,
    heapUsed: `${Math.round(mem.heapUsed / 1024 / 1024)} MB`,
    external: `${Math.round(mem.external / 1024 / 1024)} MB`
  });
}, memoryInterval);

// Cargar la aplicación principal
console.log('Iniciando aplicación CdelU...');
require('./src/index.js'); 