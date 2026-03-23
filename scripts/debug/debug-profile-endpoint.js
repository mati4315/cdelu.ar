const jwt = require('jsonwebtoken');

/**
 * Script para debuggear el endpoint de perfil
 */

// Generar un token de prueba válido (usa el mismo secret que en tu app)
const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta'; // Ajustar según tu configuración

// Datos de prueba de usuario
const testUser = {
  id: 1, // Usa un ID que exista en tu base de datos
  email: 'test@example.com',
  rol: 'usuario'
};

// Generar token
const token = jwt.sign(testUser, JWT_SECRET, { expiresIn: '1h' });

console.log('🔑 Token generado:', token);
console.log('\n📋 Para probar el endpoint:');
console.log(`curl -H "Authorization: Bearer ${token}" http://localhost:3001/api/v1/profile/me`);

// También generar un comando PowerShell
console.log('\n🔹 PowerShell:');
console.log(`Invoke-WebRequest -Method GET -Uri "http://localhost:3001/api/v1/profile/me" -Headers @{"Authorization"="Bearer ${token}"}`);

async function testEndpoint() {
  try {
    const response = await fetch('http://localhost:3001/api/v1/profile/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('\n📊 Resultado del test:');
    console.log('Status:', response.status);
    console.log('OK:', response.ok);
    
    const result = await response.text();
    console.log('Respuesta:', result);
    
  } catch (error) {
    console.log('\n❌ Error en test:', error.message);
  }
}

// Ejecutar test si fetch está disponible
if (typeof fetch !== 'undefined') {
  testEndpoint();
} else {
  console.log('\n⚠️  Para ejecutar el test automático, ejecuta este script en Node.js 18+');
} 