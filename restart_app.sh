#!/bin/bash

# Script para reiniciar la aplicación Node.js en cPanel
echo "==============================================="
echo "REINICIANDO APLICACIÓN NODE.JS EN CPANEL"
echo "==============================================="

# Variables de entorno
APP_NAME="diario.trigamer.xyz"
LOG_FILE="restart_$(date +%Y%m%d%H%M%S).log"

echo "Iniciando proceso de reinicio a las $(date)" | tee -a $LOG_FILE

# 1. Verificar si estamos en el directorio correcto
if [ ! -f "passenger_app.js" ]; then
    echo "❌ ERROR: No se encontró el archivo passenger_app.js" | tee -a $LOG_FILE
    echo "Asegúrate de ejecutar este script desde el directorio raíz de la aplicación" | tee -a $LOG_FILE
    exit 1
fi

# 2. Verificar que .env.production existe
if [ ! -f ".env.production" ]; then
    echo "❌ ERROR: No se encontró el archivo .env.production" | tee -a $LOG_FILE
    echo "Crea este archivo antes de continuar" | tee -a $LOG_FILE
    exit 1
fi

# 3. Hacer backup del archivo .env actual
echo "Creando backup del archivo .env actual..." | tee -a $LOG_FILE
if [ -f ".env" ]; then
    cp .env .env.backup
    echo "✅ Backup creado como .env.backup" | tee -a $LOG_FILE
else
    echo "⚠️ No se encontró un archivo .env existente" | tee -a $LOG_FILE
fi

# 4. Copiar .env.production a .env
echo "Copiando configuración de producción..." | tee -a $LOG_FILE
cp .env.production .env
echo "✅ Archivo .env actualizado con configuración de producción" | tee -a $LOG_FILE

# 5. Reiniciar la aplicación usando el sistema de cPanel
echo "Intentando reiniciar la aplicación Node.js..." | tee -a $LOG_FILE

# Intentar usar el script de restart de cPanel si está disponible
if [ -x "/usr/local/cpanel/scripts/restart_nodejs_app" ]; then
    echo "Usando script de cPanel para reiniciar..." | tee -a $LOG_FILE
    /usr/local/cpanel/scripts/restart_nodejs_app $APP_NAME | tee -a $LOG_FILE
    RESTART_STATUS=$?
else
    # Alternativa: tocar el archivo .htaccess para forzar un reinicio
    echo "Script de cPanel no encontrado, usando método alternativo..." | tee -a $LOG_FILE
    
    # Respaldar .htaccess
    cp .htaccess .htaccess.backup
    
    # Modificar y restaurar .htaccess para forzar reinicio
    echo "# Forced restart at $(date)" >> .htaccess
    cp .htaccess.backup .htaccess
    
    RESTART_STATUS=0
    echo "✅ Aplicación debería reiniciarse pronto" | tee -a $LOG_FILE
fi

# 6. Verificar resultado
if [ $RESTART_STATUS -eq 0 ]; then
    echo "✅ El proceso de reinicio se completó exitosamente" | tee -a $LOG_FILE
    echo "La aplicación debería estar disponible en unos momentos" | tee -a $LOG_FILE
else
    echo "❌ Error al reiniciar la aplicación" | tee -a $LOG_FILE
    echo "Intenta reiniciar manualmente desde el panel de cPanel" | tee -a $LOG_FILE
fi

echo "==============================================="
echo "PROCESO COMPLETADO"
echo "==============================================="
echo "Revisa los logs de Apache para verificar que la aplicación inició correctamente" | tee -a $LOG_FILE
echo "Ubicación típica: /var/log/apache2/error_log o en la sección de logs de cPanel" | tee -a $LOG_FILE 