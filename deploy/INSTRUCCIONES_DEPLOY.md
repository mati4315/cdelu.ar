# 🚀 INSTRUCCIONES PARA SUBIR AL HOSTING

## 1. Subir archivos
1. Comprime la carpeta 'deploy' en un archivo ZIP
2. Sube el ZIP a tu hosting en cPanel
3. Extrae el archivo ZIP en el directorio de tu dominio

## 2. Configurar base de datos
1. Ve a cPanel > Bases de datos MySQL
2. Crea una nueva base de datos llamada 'trigamer_diario'
3. Crea un usuario MySQL con permisos en la base de datos
4. Ejecuta el script 'setup_database.sql' en phpMyAdmin

## 3. Configurar variables de entorno
1. Copia 'env.production.example' como '.env'
2. Edita el archivo .env con tus datos:
   - DB_USER: tu_usuario_mysql
   - DB_PASSWORD: tu_contraseña_mysql
   - JWT_SECRET: genera una clave secreta segura

## 4. Configurar aplicación Node.js
1. Ve a cPanel > Setup Node.js App
2. Configura la aplicación:
   - Startup File: passenger_app.js
   - Node.js Version: 18.x o superior
   - Environment Variables: copia las del archivo .env

## 5. Instalar dependencias
En la terminal de cPanel:
```bash
cd /home/tu_usuario/diario.trigamer.xyz
npm install
npm install undici@5.28.4 --save
```

## 6. Reiniciar aplicación
1. En cPanel > Setup Node.js App
2. Haz clic en "Restart" en tu aplicación

## 7. Verificar funcionamiento
- Visita: https://diario.trigamer.xyz
- Prueba login con: test@test.com / 123456

## 📋 Credenciales de prueba:
- Email: test@test.com
- Contraseña: 123456
- Admin: matias4315@gmail.com / w35115415

## 🔧 Si hay problemas:
1. Revisa los logs en cPanel > Error Logs
2. Verifica la conexión a la base de datos
3. Asegúrate que las variables de entorno estén configuradas
