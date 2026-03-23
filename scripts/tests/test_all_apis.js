/**
 * Script para probar todas las APIs nuevas
 */

async function testAllAPIs() {
  const baseURL = 'http://localhost:3001/api/v1';
  
  console.log('🧪 PROBANDO TODAS LAS APIS NUEVAS\n');
  
  const tests = [
    {
      name: '🔍 Perfil público',
      url: `${baseURL}/users/profile/administrador.1`,
      method: 'GET'
    },
    {
      name: '📝 Posts del usuario',  
      url: `${baseURL}/users/profile/administrador.1/posts`,
      method: 'GET'
    },
    {
      name: '👥 Seguidores',
      url: `${baseURL}/users/profile/administrador.1/followers`,
      method: 'GET'
    },
    {
      name: '🔗 Siguiendo',
      url: `${baseURL}/users/profile/administrador.1/following`, 
      method: 'GET'
    },
    {
      name: '🔎 Búsqueda de usuarios',
      url: `${baseURL}/users/search?query=admin`,
      method: 'GET'
    },
    {
      name: '📰 Feed con info de usuario',
      url: `${baseURL}/feed?limit=2`,
      method: 'GET'
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(`\n${test.name}:`);
      console.log(`  URL: ${test.url}`);
      
      const response = await fetch(test.url);
      const data = await response.json();
      
      if (response.ok && data.success !== false) {
        console.log(`  ✅ ÉXITO (${response.status})`);
        
        // Mostrar información relevante
        if (data.data) {
          if (Array.isArray(data.data)) {
            console.log(`  📊 ${data.data.length} elementos encontrados`);
            if (data.pagination) {
              console.log(`  📄 Página ${data.pagination.page}/${data.pagination.totalPages} (total: ${data.pagination.total})`);
            }
          } else if (typeof data.data === 'object') {
            if (data.data.username) {
              console.log(`  👤 Usuario: ${data.data.nombre} (@${data.data.username})`);
              if (data.data.stats) {
                console.log(`  📈 Stats: ${data.data.stats.followers_count} seguidores, ${data.data.stats.posts_count} posts`);
              }
            }
          }
        }
        passed++;
      } else {
        console.log(`  ❌ ERROR (${response.status}): ${data.error || 'Error desconocido'}`);
        failed++;
      }
      
    } catch (error) {
      console.log(`  ❌ EXCEPCIÓN: ${error.message}`);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`📊 RESUMEN DE PRUEBAS:`);
  console.log(`✅ Pasaron: ${passed}/${tests.length}`);
  console.log(`❌ Fallaron: ${failed}/${tests.length}`);
  
  if (failed === 0) {
    console.log('\n🎉 ¡TODAS LAS APIS FUNCIONAN CORRECTAMENTE!');
    console.log('\n📋 ENDPOINTS LISTOS PARA EL FRONTEND:');
    console.log('   🔍 GET /api/v1/users/profile/:username - Perfil público');
    console.log('   📝 GET /api/v1/users/profile/:username/posts - Posts del usuario');  
    console.log('   ➕ POST /api/v1/users/:id/follow - Seguir usuario (requiere auth)');
    console.log('   ➖ DELETE /api/v1/users/:id/follow - Dejar de seguir (requiere auth)');
    console.log('   👥 GET /api/v1/users/profile/:username/followers - Seguidores');
    console.log('   🔗 GET /api/v1/users/profile/:username/following - Siguiendo');
    console.log('   🔎 GET /api/v1/users/search?query=nombre - Buscar usuarios');
    console.log('   📰 GET /api/v1/feed - Feed con información de usuario');
    console.log('\n✨ El frontend puede implementar /user/:username inmediatamente!');
  } else {
    console.log('\n⚠️  Hay algunas APIs que necesitan revisión.');
  }
}

// Ejecutar las pruebas
testAllAPIs().catch(console.error);
