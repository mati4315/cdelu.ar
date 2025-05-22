#!/bin/bash

# Directorio de la aplicación
APP_DIR=$(dirname "$(readlink -f "$0")")
cd "$APP_DIR"

# Instalar dependencias si es necesario
if [ ! -d "node_modules" ]; then
    npm ci --only=production
fi

# Instalar PM2 globalmente si no está instalado
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi

# Detener cualquier instancia existente
pm2 stop diario 2>/dev/null || true
pm2 delete diario 2>/dev/null || true

# Iniciar la aplicación con PM2 y configuración optimizada
pm2 start ecosystem.config.js

# Mostrar estado
pm2 status

echo "==================================================="
echo "Aplicación iniciada. Logs disponibles con: pm2 logs"
echo "===================================================" 