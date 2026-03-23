#!/bin/bash

# Script de instalación para producción en cPanel
# Evita dependencias problemáticas como Sharp y FFmpeg

echo "🚀 Instalando dependencias para producción..."

# Hacer backup del package.json original
if [ -f "package.json" ]; then
    cp package.json package.json.backup
    echo "✅ Backup de package.json creado"
fi

# Usar el package.json de producción
cp package.production.json package.json
echo "✅ Usando package.json de producción"

# Limpiar instalaciones previas
echo "🧹 Limpiando instalaciones previas..."
rm -rf node_modules
rm -f package-lock.json

# Instalar dependencias sin opcionales
echo "📦 Instalando dependencias..."
npm ci --production --no-optional --ignore-scripts

# Verificar instalación
echo "🔍 Verificando instalación..."
if [ -d "node_modules" ]; then
    echo "✅ node_modules creado correctamente"
    
    # Verificar dependencias críticas
    critical_deps=("fastify" "mysql2" "@fastify/cors")
    for dep in "${critical_deps[@]}"; do
        if [ -d "node_modules/$dep" ]; then
            echo "✅ $dep instalado"
        else
            echo "❌ $dep NO instalado"
        fi
    done
else
    echo "❌ Error: node_modules no fue creado"
    exit 1
fi

# Restaurar package.json original si existe backup
if [ -f "package.json.backup" ]; then
    mv package.json.backup package.json
    echo "✅ package.json original restaurado"
fi

echo "🎉 Instalación de producción completada"
echo ""
echo "📋 Próximos pasos:"
echo "1. Configura las variables de entorno en cPanel"
echo "2. Reinicia la aplicación en Setup Node.js App"
echo "3. Verifica que funcione visitando /health" 