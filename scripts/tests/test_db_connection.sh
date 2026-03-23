#!/bin/bash

# Script para probar la conexión a la base de datos en entorno de producción
echo "===================================================="
echo "🔍 Script de prueba de conexión a base de datos"
echo "===================================================="

# Obtener la contraseña de forma segura
read -sp "Ingresa la contraseña de la base de datos: " DB_PASSWORD
echo ""

# Crear un archivo .env temporal para la prueba
cat > .env.test << EOL
DB_HOST=localhost
DB_PORT=3306
DB_USER=trigamer_diario
DB_PASSWORD=$DB_PASSWORD
DB_NAME=trigamer_diario
EOL

echo "📝 Ejecutando prueba de conexión..."
echo "===================================================="

# Modificar temporalmente el script dbtest_prod.js para usar la contraseña
sed -i "s/password: '',/password: '$DB_PASSWORD',/" dbtest_prod.js

# Ejecutar la prueba
node dbtest_prod.js

# Restaurar el script dbtest_prod.js
sed -i "s/password: '$DB_PASSWORD',/password: '',/" dbtest_prod.js

# Eliminar el archivo .env temporal
rm .env.test

echo "===================================================="
echo "Prueba completada."
echo "====================================================" 