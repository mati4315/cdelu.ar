const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:3001';

async function createAdminUser() {
  try {
    console.log('👤 Creando usuario administrador...');
    
    const adminData = {
      username: 'lottery_admin',
      password: 'admin123',
      email: 'lottery_admin@cdelu.ar',
      nombre: 'Administrador Loterías',
      role: 'admin'
    };
    
    const response = await axios.post(`${BASE_URL}/api/v1/auth/register`, adminData);
    
    console.log('✅ Usuario administrador creado exitosamente');
    console.log('📋 Datos de acceso:');
    console.log(`   Usuario: ${adminData.username}`);
    console.log(`   Contraseña: ${adminData.password}`);
    console.log(`   Email: ${adminData.email}`);
    console.log(`   Nombre: ${adminData.nombre}`);
    console.log(`   Rol: ${adminData.role}`);
    
    console.log('\n🌐 URLs del sistema:');
    console.log(`   Dashboard Admin: ${BASE_URL}/lottery-admin.html`);
    console.log(`   Página Usuarios: ${BASE_URL}/lottery.html`);
    
  } catch (error) {
    if (error.response?.status === 409) {
      console.log('ℹ️ El usuario administrador ya existe');
    } else {
      console.error('❌ Error al crear usuario:', error.message);
      if (error.response?.data) {
        console.error('Respuesta del servidor:', error.response.data);
      }
    }
  }
}

createAdminUser(); 