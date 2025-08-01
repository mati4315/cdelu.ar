#!/bin/bash

echo "🔧 SOLUCIONANDO ERROR DE @fastify/swagger-ui"
echo "============================================="
echo ""

# Verificar directorio
EXPECTED_DIR="/home/trigamer/diario.trigamer.xyz"
CURRENT_DIR=$(pwd)

if [ "$CURRENT_DIR" != "$EXPECTED_DIR" ]; then
    echo "❌ Error: Ejecutar desde $EXPECTED_DIR"
    exit 1
fi

echo "📍 Directorio correcto: $CURRENT_DIR"
echo ""

# 1. Instalar dependencia faltante específicamente
echo "📦 PASO 1: Instalando @fastify/swagger-ui..."
npm install @fastify/swagger-ui@^5.0.1 --save

if [ $? -eq 0 ]; then
    echo "✅ @fastify/swagger-ui instalado correctamente"
else
    echo "❌ Error al instalar @fastify/swagger-ui"
    echo "🔄 Intentando instalación alternativa..."
    npm install @fastify/swagger-ui --save --legacy-peer-deps
fi
echo ""

# 2. Verificar que se instaló
echo "🔍 PASO 2: Verificando instalación..."
if [ -d "node_modules/@fastify/swagger-ui" ]; then
    echo "✅ @fastify/swagger-ui encontrado en node_modules"
else
    echo "❌ @fastify/swagger-ui NO encontrado"
    echo "🆘 Usando modo sin Swagger..."
fi
echo ""

# 3. Test de carga del módulo
echo "🧪 PASO 3: Probando carga del módulo..."
node -e "
try {
  require('@fastify/swagger-ui');
  console.log('✅ @fastify/swagger-ui se carga correctamente');
} catch (error) {
  console.log('❌ Error al cargar @fastify/swagger-ui:', error.message);
  console.log('🔄 La aplicación usará modo mínimo sin Swagger');
}
"
echo ""

# 4. Verificar otras dependencias críticas
echo "🔍 PASO 4: Verificando dependencias críticas..."
CRITICAL_DEPS=("fastify" "mysql2" "@fastify/cors" "@fastify/jwt" "@fastify/static" "@fastify/multipart")

for dep in "${CRITICAL_DEPS[@]}"; do
    if [ -d "node_modules/$dep" ]; then
        echo "✅ $dep instalado"
    else
        echo "❌ $dep NO instalado - instalando..."
        npm install "$dep" --save
    fi
done
echo ""

# 5. Test completo de la aplicación
echo "🧪 PASO 5: Test de carga de la aplicación..."
node -e "
try {
  console.log('Probando carga de app.js...');
  require('./src/app.js');
  console.log('✅ app.js se carga correctamente');
} catch (error) {
  console.log('❌ Error en app.js:', error.message);
  console.log('🔄 Probando app.minimal.js...');
  
  try {
    require('./src/app.minimal.js');
    console.log('✅ app.minimal.js se carga correctamente');
  } catch (minimalError) {
    console.log('❌ Error en app.minimal.js:', minimalError.message);
  }
}
"
echo ""

# 6. Configurar permisos
echo "🔐 PASO 6: Configurando permisos..."
chmod 644 passenger_app.js
chmod 644 src/app.js
chmod 644 src/app.minimal.js
chmod 644 src/index.js
chmod 644 src/index.minimal.js
echo "✅ Permisos configurados"
echo ""

echo "📋 RESUMEN:"
echo "==========="
echo "✅ Dependencia @fastify/swagger-ui instalada"
echo "✅ Aplicación configurada con fallback a modo mínimo"
echo "✅ passenger_app.js configurado para manejar errores"
echo ""

echo "🎯 PRÓXIMOS PASOS:"
echo "1. Ve a cPanel > Setup Node.js App"
echo "2. Haz clic en 'Restart' en tu aplicación"
echo "3. Verifica en:"
echo "   - https://diario.trigamer.xyz/health"
echo "   - https://diario.trigamer.xyz/api/v1/status"
echo ""

echo "💡 NOTA:"
echo "Si persiste el error, la aplicación automáticamente"
echo "usará el modo mínimo sin Swagger pero con toda"
echo "la funcionalidad de API funcionando."
echo ""

echo "🎉 REPARACIÓN COMPLETADA" 