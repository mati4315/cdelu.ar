#!/bin/bash

# Nombre del archivo zip a generar
ZIP_NAME="diario_passenger_deploy.zip"

# Directorio temporal para la preparación
TEMP_DIR="deploy_temp"

# Crear directorio temporal
mkdir -p "$TEMP_DIR"

# Copiar archivos necesarios
echo "Copiando archivos necesarios..."
cp -r src/ "$TEMP_DIR/"
cp -r public/ "$TEMP_DIR/"
cp package.json "$TEMP_DIR/"
cp package-lock.json "$TEMP_DIR/"
cp .env.production "$TEMP_DIR/.env"
cp .htaccess "$TEMP_DIR/"
cp passenger_app.js "$TEMP_DIR/"

# Eliminar archivos innecesarios o sensibles
echo "Limpiando archivos innecesarios..."
find "$TEMP_DIR" -name "*.log" -type f -delete
find "$TEMP_DIR" -name ".DS_Store" -type f -delete
find "$TEMP_DIR" -name "node_modules" -type d -exec rm -rf {} +
find "$TEMP_DIR" -name ".git" -type d -exec rm -rf {} +

# Crear archivo zip
echo "Creando archivo zip para despliegue..."
cd "$TEMP_DIR" && zip -r "../$ZIP_NAME" . && cd ..

# Limpiar
echo "Limpiando archivos temporales..."
rm -rf "$TEMP_DIR"

echo "======================="
echo "Proceso completado!"
echo "Archivo listo para subir a cPanel: $ZIP_NAME"
echo "======================="
echo ""
echo "Instrucciones para despliegue en Passenger:"
echo "1. Sube el archivo $ZIP_NAME a tu cuenta de cPanel"
echo "2. Extrae el archivo en el directorio '/home/trigamer/diario.trigamer.xyz'"
echo "3. Actualiza la contraseña de la base de datos en el archivo .env"
echo "4. Ejecuta 'npm ci --only=production' para instalar dependencias"
echo "5. Reinicia la aplicación desde el panel de control de cPanel"
echo "=======================" 