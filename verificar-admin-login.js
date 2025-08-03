const axios = require('axios');

async function verificarAdmin() {
  try {
    console.log('🔐 Verificando login de administrador...');
    
    const response = await axios.post('http://localhost:3001/api/v1/auth/login', {
      email: 'admin@cdelu.ar',
      password: 'admin123'
    });
    
    console.log('✅ Login exitoso');
    console.log('👤 Usuario:', response.data.user.nombre);
    console.log('🎭 Rol:', response.data.user.rol);
    console.log('🔑 ¿Es administrador?', response.data.user.rol === 'administrador');
    
    if (response.data.user.rol === 'administrador') {
      console.log('\n🎉 ¡PERFECTO! El usuario tiene rol de administrador');
      console.log('✅ Ahora lottery-admin.html debería permitir el acceso');
    } else {
      console.log('\n❌ El usuario NO tiene rol de administrador');
      console.log('🔧 Rol actual:', response.data.user.rol);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verificarAdmin(); 