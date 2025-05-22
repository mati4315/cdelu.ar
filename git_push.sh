#!/bin/bash

# Script para subir los cambios al repositorio Git
echo "==============================================="
echo "SUBIENDO CAMBIOS AL REPOSITORIO GIT"
echo "==============================================="

# Variables
REPO_URL="tu_repositorio_git_url_aqui"  # Reemplaza con la URL de tu repositorio
BRANCH="main"                           # Reemplaza con la rama que quieres usar

# Verificar si git está instalado
if ! command -v git &> /dev/null; then
    echo "❌ ERROR: Git no está instalado"
    exit 1
fi

# Verificar si estamos en un repositorio git
if [ ! -d .git ]; then
    echo "Inicializando repositorio Git..."
    git init
    git remote add origin $REPO_URL
    echo "✅ Repositorio Git inicializado y origen configurado"
else
    echo "✅ Repositorio Git ya existente"
    # Actualizar URL remota por si ha cambiado
    git remote set-url origin $REPO_URL
fi

# Crear archivo .gitignore si no existe
if [ ! -f .gitignore ]; then
    echo "Creando archivo .gitignore..."
    cat > .gitignore << EOL
# Dependencias
node_modules/
npm-debug.log
yarn-debug.log
yarn-error.log

# Archivos de entorno
.env
.env.local
.env.*.local
.env.backup

# Logs
logs/
*.log

# Archivos temporales
tmp/
temp/
*.tmp

# Archivos de sistema
.DS_Store
Thumbs.db

# Archivos de despliegue
deploy_temp/
diario_passenger_deploy.zip
diario_deploy.zip
restart_*.log

# Archivos de configuración específicos del editor
.idea/
.vscode/
*.sublime-project
*.sublime-workspace
EOL
    echo "✅ Archivo .gitignore creado"
fi

# Preparar archivos para commit
echo "Agregando archivos al staging..."
git add .
git add -f .htaccess
git add -f .env.production
git add -f passenger_app.js
git add -f troubleshoot.js
git add -f check_passenger.js
git add -f restart_app.sh

# Excluir archivos sensibles o grandes
git reset -- node_modules/
git reset -- .env

# Crear commit
echo "Creando commit..."
git commit -m "Correcciones para el entorno de producción: arreglos de rutas API y manejo de errores"

# Subir cambios
echo "Subiendo cambios a $BRANCH..."
git push -u origin $BRANCH

echo "==============================================="
echo "PROCESO COMPLETADO"
echo "==============================================="
echo "Verifica que los cambios se hayan subido correctamente a tu repositorio." 