/**
 * Punto de entrada para Passenger
 * Este archivo configura límites de memoria y otras optimizaciones
 * antes de cargar la aplicación principal
 */

// DESHABILITAR WEBASSEMBLY GLOBALMENTE
process.env.NODE_OPTIONS = (process.env.NODE_OPTIONS || '') + ' --no-wasm';

// Configurar undici para usar menos memoria
process.env.UNDICI_WASM = '0';
process.env.UNDICI_DISABLE_WASM = 'true';

// Configurar variables de entorno para hosting compartido
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.UV_THREADPOOL_SIZE = '2'; // Reducir threads

// Deshabilitar WebAssembly a nivel de proceso
if (typeof WebAssembly !== 'undefined') {
  try {
    // Reemplazar WebAssembly.instantiate con una función que lanza error controlado
    const originalInstantiate = WebAssembly.instantiate;
    WebAssembly.instantiate = function() {
      console.warn('WebAssembly deshabilitado para conservar memoria');
      return Promise.reject(new Error('WebAssembly deshabilitado'));
    };
    
    // También deshabilitar otras funciones de WebAssembly
    WebAssembly.compile = function() {
      return Promise.reject(new Error('WebAssembly deshabilitado'));
    };
    
    console.log('✅ WebAssembly deshabilitado correctamente');
  } catch (e) {
    console.log('⚠️ No se pudo deshabilitar WebAssembly:', e.message);
  }
}

// Configurar límites de memoria para V8 (versión compatible)
const v8 = require('v8');
try {
  // Configuración de memoria más conservadora para hosting compartido
  const heapSizeLimit = v8.getHeapStatistics().heap_size_limit;
  const desiredHeapSizeInBytes = 512 * 1024 * 1024; // 512MB (reducido para hosting)
  
  if (heapSizeLimit > desiredHeapSizeInBytes) {
    // Solo ajustar si el límite actual es mayor que el deseado
    v8.setFlagsFromString('--max_old_space_size=512');
    console.log('Límite de memoria V8 ajustado a 512MB');
  }
  
  // Configuración más conservadora para hosting compartido
  v8.setFlagsFromString('--min_semi_space_size=1');
  v8.setFlagsFromString('--max_semi_space_size=4');
  
  // Optimizar para menos memoria
  v8.setFlagsFromString('--optimize_for_size');
  v8.setFlagsFromString('--memory_reducer');
  
  // Deshabilitar WebAssembly también a nivel V8
  v8.setFlagsFromString('--no-wasm');
  v8.setFlagsFromString('--wasm-disable-structured-cloning');
  
  console.log('Optimizaciones de memoria V8 aplicadas (modo hosting sin WASM)');
} catch (err) {
  console.error('No se pudo ajustar el límite de memoria:', err.message);
}

// Configurar manejo de excepciones no capturadas
process.on('uncaughtException', (err) => {
  console.error('Error no capturado:', err.message);
  
  // Filtrar errores de WebAssembly que son esperados
  if (err.message && err.message.includes('WebAssembly')) {
    console.log('💡 Error de WebAssembly ignorado (esperado en hosting compartido)');
    return;
  }
  
  // No cerrar el proceso para que Passenger pueda reiniciarlo si es necesario
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Promesa rechazada no manejada:', reason);
  
  // Filtrar errores de WebAssembly/undici que son esperados
  if (reason && reason.message && 
      (reason.message.includes('WebAssembly') || 
       reason.message.includes('undici') ||
       reason.message.includes('Wasm memory'))) {
    console.log('💡 Error de WebAssembly/undici ignorado (esperado en hosting compartido)');
    return;
  }
});

// Limitar el uso de memoria de Buffer
try {
  if (global.Buffer) {
    global.Buffer.poolSize = 4 * 1024; // 4KB en lugar del predeterminado 8MB
    console.log('Buffer poolSize reducido a 4KB');
  }
} catch (e) {
  console.error('No se pudo ajustar Buffer.poolSize:', e);
}

// Configurar intervalo de GC explícito si está disponible (más frecuente)
if (global.gc) {
  const gcInterval = 5 * 60 * 1000; // 5 minutos (más frecuente)
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

// Monitorear uso de memoria (más frecuente para hosting compartido)
const memoryInterval = 15 * 60 * 1000; // 15 minutos
setInterval(() => {
  const mem = process.memoryUsage();
  console.log({
    rss: `${Math.round(mem.rss / 1024 / 1024)} MB`,
    heapTotal: `${Math.round(mem.heapTotal / 1024 / 1024)} MB`,
    heapUsed: `${Math.round(mem.heapUsed / 1024 / 1024)} MB`,
    external: `${Math.round(mem.external / 1024 / 1024)} MB`
  });
}, memoryInterval);

// Cargar la aplicación principal - USAR VERSIÓN MÍNIMA TEMPORALMENTE
console.log('Iniciando aplicación CdelU (modo hosting optimizado sin WebAssembly)...');

// Intentar cargar la versión completa, si falla usar la mínima
try {
  require('./src/index.js');
  console.log('✅ Aplicación completa cargada correctamente');
} catch (error) {
  console.error('❌ Error al cargar aplicación completa:', error.message);
  console.log('🔄 Cargando versión mínima sin Swagger...');
  
  try {
    require('./src/index.minimal.js');
    console.log('✅ Aplicación mínima cargada correctamente');
  } catch (minimalError) {
    console.error('💥 Error crítico al cargar aplicación mínima:', minimalError.message);
    
    // Último recurso: servidor ultra-básico
    console.log('🆘 Iniciando servidor de emergencia ultra-básico...');
    const fastify = require('fastify')({ logger: false });
    
    fastify.get('/health', async (request, reply) => {
      return { 
        status: 'EMERGENCY',
        timestamp: new Date().toISOString(),
        error: 'Aplicación principal no disponible',
        message: 'Servidor en modo de emergencia'
      };
    });
    
    fastify.listen({ port: 3001, host: '0.0.0.0' })
      .then(address => {
        console.log(`🆘 Servidor de emergencia en ${address}`);
      })
      .catch(emergencyError => {
        console.error('💥 Error fatal:', emergencyError.message);
        process.exit(1);
      });
  }
} 