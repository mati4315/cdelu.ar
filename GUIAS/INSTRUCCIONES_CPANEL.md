# Instrucciones para Implementar la Aplicación en cPanel

## Problema actual

Actualmente estás recibiendo un error 503 (Service Unavailable) al intentar conectarte a la API `https://diario.trigamer.xyz/api/v1/auth/login`. Este error indica que la aplicación Node.js no está funcionando correctamente en el servidor.

## Solución

### 1. Preparar los archivos para cPanel

Crea un archivo ZIP con los siguientes directorios y archivos:

```
- src/
- public/
- package.json
- package-lock.json
- .env (con configuración de producción)
```

### 2. Configuración del .env para producción

Asegúrate de que tu archivo `.env` contenga la configuración correcta para producción:

```
# Configuración del Servidor
PORT=3001
HOST=0.0.0.0
CORS_ORIGIN=https://diario.trigamer.xyz

# Configuración de Base de Datos
DB_HOST=localhost
DB_USER=tu_usuario_de_mysql
DB_PASSWORD=tu_contraseña_de_mysql
DB_NAME=tu_nombre_de_base_de_datos

# Configuración de JWT
JWT_SECRET=tu_clave_secreta_jwt
JWT_EXPIRATION=1d

# Configuración de Logs
LOG_LEVEL=info
```

### 3. Subir archivos a cPanel

1. Accede a tu cPanel usando tus credenciales
2. Navega a la sección "Administrador de Archivos"
3. Crea un directorio para tu aplicación (por ejemplo, "app")
4. Sube el archivo ZIP a ese directorio
5. Extrae el archivo ZIP

### 4. Configuración de la aplicación Node.js en cPanel

1. En cPanel, ve a la sección "Setup Node.js App" o "Configurar Aplicación Node.js"
2. Configura tu aplicación con la siguiente información:
   - **Directorio de la aplicación**: /home/tu_usuario/app
   - **Punto de entrada de la aplicación**: src/index.js
   - **Versión de Node.js**: Selecciona la versión 18.x o superior
   - **Modo de arranque**: Production
   - **Dominio/subdominio**: diario.trigamer.xyz

3. Haz clic en "Crear" o "Save"

### 5. Instalar dependencias

Conéctate a tu servidor a través de SSH y ejecuta los siguientes comandos:

```bash
cd ~/app
npm ci
```

### 6. Configuración del proxy para Node.js

Es necesario configurar Apache o Nginx (según lo que use tu proveedor de cPanel) para que redirija las solicitudes a tu aplicación Node.js:

#### Para Apache (archivo .htaccess en la raíz del sitio):

```apache
<IfModule mod_rewrite.c>
RewriteEngine On
RewriteRule ^api/v1/(.*)$ http://localhost:3001/api/v1/$1 [P,L]
</IfModule>
```

### 7. Iniciar la aplicación

En cPanel, regresa a la sección "Setup Node.js App" y:

1. Haz clic en "Iniciar aplicación"
2. Asegúrate de que se ejecuta con el comando: `npm start`
3. Verifica que la aplicación esté funcionando correctamente

### 8. Configuración de archivo config.js

Asegúrate de que el archivo `public/config.js` tenga la siguiente configuración:

```javascript
(function(window) {
    // Configuración de entorno para el frontend
    window.__env = window.__env || {};
    // URL base de la API: usa el dominio completo para la versión de producción
    window.__env.API_BASE_URL = 'https://diario.trigamer.xyz/api/v1';
})(this);
```

### 9. Verificar Logs

Si sigues teniendo problemas, revisa los archivos de log:

1. En cPanel, ve a la sección "Logs"
2. Revisa los logs de error de Node.js
3. Verifica también los logs de error de Apache o Nginx

## Solución alternativa si cPanel no soporta Node.js

Si tu plan de hosting en cPanel no incluye soporte para Node.js, puedes:

1. Solicitar a tu proveedor que habilite la función de Node.js
2. Migrar a un servicio que soporte aplicaciones Node.js como:
   - Render
   - Railway
   - Heroku
   - DigitalOcean
   - Vercel

## Consideraciones de seguridad

1. Asegúrate de que el archivo `.env` contenga valores seguros y únicos para la producción
2. Configura correctamente los encabezados CORS para permitir solo los dominios necesarios
3. Utiliza HTTPS en producción para todas las comunicaciones
4. Asegúrate de que los permisos de los archivos sean apropiados en el servidor

Si continúas teniendo problemas después de seguir estas instrucciones, considera contactar al soporte técnico de tu proveedor de hosting. 