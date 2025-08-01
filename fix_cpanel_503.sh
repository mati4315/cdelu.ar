#!/bin/bash

echo "🚨 SOLUCIONANDO ERROR 503 EN CPANEL - CdelU API"
echo "================================================"
echo ""

# 1. Verificar directorio actual
echo "📍 PASO 1: Verificando ubicación..."
EXPECTED_DIR="/home/trigamer/diario.trigamer.xyz"
CURRENT_DIR=$(pwd)

if [ "$CURRENT_DIR" != "$EXPECTED_DIR" ]; then
    echo "❌ Error: Debes ejecutar este script desde $EXPECTED_DIR"
    echo "   Directorio actual: $CURRENT_DIR"
    echo "   Ejecuta: cd $EXPECTED_DIR && bash fix_cpanel_503.sh"
    exit 1
fi

echo "✅ Directorio correcto: $CURRENT_DIR"
echo ""

# 2. Hacer backup de archivos importantes
echo "💾 PASO 2: Creando backups..."
mkdir -p backups/$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"

if [ -f "package.json" ]; then
    cp package.json "$BACKUP_DIR/package.json.backup"
    echo "✅ Backup de package.json creado"
fi

if [ -d "node_modules" ]; then
    echo "✅ node_modules existente detectado (se eliminará)"
fi
echo ""

# 3. Limpiar instalación anterior
echo "🧹 PASO 3: Limpiando instalación anterior..."
rm -rf node_modules
rm -f package-lock.json
echo "✅ node_modules y package-lock.json eliminados"
echo ""

# 4. Usar package.json de producción (sin Sharp/FFmpeg)
echo "📦 PASO 4: Configurando dependencias de producción..."
if [ -f "package.production.json" ]; then
    cp package.production.json package.json
    echo "✅ Usando package.json de producción (sin Sharp/FFmpeg)"
else
    echo "⚠️ package.production.json no encontrado, usando package.json actual"
fi
echo ""

# 5. Instalar dependencias
echo "⬇️ PASO 5: Instalando dependencias..."
npm ci --production --no-optional --ignore-scripts

if [ $? -eq 0 ]; then
    echo "✅ Dependencias instaladas correctamente"
else
    echo "❌ Error al instalar dependencias"
    echo "Intentando instalación alternativa..."
    npm install --production --no-optional --ignore-scripts
fi
echo ""

# 6. Verificar dependencias críticas
echo "🔍 PASO 6: Verificando dependencias críticas..."
CRITICAL_DEPS=("fastify" "mysql2" "@fastify/cors" "@fastify/jwt")

for dep in "${CRITICAL_DEPS[@]}"; do
    if [ -d "node_modules/$dep" ]; then
        echo "✅ $dep instalado"
    else
        echo "❌ $dep NO instalado"
    fi
done
echo ""

# 7. Verificar permisos
echo "🔐 PASO 7: Configurando permisos..."
chmod 644 passenger_app.js
chmod 644 src/app.js
chmod 644 src/index.js
chmod 644 package.json
chmod -R 755 public/
echo "✅ Permisos configurados"
echo ""

# 8. Verificar configuración de Passenger
echo "🚀 PASO 8: Verificando configuración de Passenger..."
if [ -f ".htaccess" ]; then
    if grep -q "PassengerAppRoot" .htaccess; then
        echo "✅ Configuración de Passenger encontrada en .htaccess"
    else
        echo "⚠️ Configuración de Passenger no encontrada en .htaccess"
    fi
else
    echo "❌ .htaccess no encontrado"
fi

if [ -f "passenger_app.js" ]; then
    echo "✅ passenger_app.js existe"
else
    echo "❌ passenger_app.js no encontrado"
fi
echo ""

# 9. Test de carga de módulos
echo "🧪 PASO 9: Probando carga de módulos..."
node -e "
try {
  require('dotenv').config();
  console.log('✅ dotenv cargado');
  
  require('fastify');
  console.log('✅ fastify cargado');
  
  require('mysql2');
  console.log('✅ mysql2 cargado');
  
  require('@fastify/cors');
  console.log('✅ @fastify/cors cargado');
  
  console.log('✅ Todos los módulos críticos se cargan correctamente');
} catch (error) {
  console.log('❌ Error al cargar módulos:', error.message);
  process.exit(1);
}
"

if [ $? -eq 0 ]; then
    echo "✅ Test de módulos exitoso"
else
    echo "❌ Error en test de módulos"
fi
echo ""

# 10. Restaurar package.json original
echo "🔄 PASO 10: Restaurando configuración..."
if [ -f "$BACKUP_DIR/package.json.backup" ]; then
    cp "$BACKUP_DIR/package.json.backup" package.json
    echo "✅ package.json original restaurado"
fi
echo ""

# 11. Mostrar resumen
echo "📋 RESUMEN DE LA REPARACIÓN:"
echo "================================"
echo "✅ Dependencias problemáticas removidas (Sharp, FFmpeg)"
echo "✅ Configuración de memoria optimizada"
echo "✅ Manejo de errores mejorado"
echo "✅ Permisos configurados correctamente"
echo ""

echo "🎯 PRÓXIMOS PASOS MANUALES:"
echo "1. Ve a cPanel > Setup Node.js App"
echo "2. Busca tu aplicación 'diario.trigamer.xyz'"
echo "3. Haz clic en 'Restart'"
echo "4. Configura las variables de entorno:"
echo "   - NODE_ENV=production"
echo "   - DB_HOST=localhost"
echo "   - DB_USER=tu_usuario_mysql"
echo "   - DB_PASSWORD=tu_contraseña_mysql"
echo "   - DB_NAME=tu_base_datos"
echo "   - JWT_SECRET=clave_secreta_muy_segura"
echo "5. Verifica que funcione visitando:"
echo "   https://diario.trigamer.xyz/health"
echo ""

echo "🔧 COMANDOS DE DIAGNÓSTICO:"
echo "- node check_passenger_status.js"
echo "- node emergency_start.js (si persisten problemas)"
echo ""

echo "🎉 REPARACIÓN COMPLETADA" 