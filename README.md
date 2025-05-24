# CdelU - Diario Digital

## Información General
Esta es la plataforma para el diario digital CdelU, desarrollada con Node.js, Fastify y MySQL.

## Configuración para Desarrollo

### Requisitos previos
- Node.js (v14 o superior)
- MySQL (v5.7 o superior)

### Instalación
1. Clonar el repositorio:
   ```bash
   git clone <url-del-repositorio>
   cd cdelu.ar
   ```

2. Instalar dependencias:
   ```bash
   npm install
   ```

3. Configurar variables de entorno:
   ```bash
   cp .env.example .env
   ```
   Editar el archivo `.env` con la configuración adecuada.

4. Iniciar la aplicación en modo desarrollo:
   ```bash
   npm run dev
   ```

## Despliegue en Producción (cPanel + Passenger)

### Preparación
1. Asegúrate de tener una cuenta de cPanel con soporte para Node.js (Passenger).
2. Configura un subdominio o dominio para la aplicación.
3. Configura una base de datos MySQL en cPanel.

### Archivos de Configuración
- `.env.production`: Contiene la configuración para el entorno de producción.
- `.htaccess`: Configuración de Apache para Passenger y rutas.
- `passenger_app.js`: Punto de entrada para Passenger.

### Pasos para el Despliegue
1. Subir todos los archivos al servidor utilizando FTP o el Administrador de Archivos de cPanel.
2. Configurar `.env.production` con los datos correctos (base de datos, JWT, etc.)
3. Ejecutar el siguiente comando para preparar el entorno:
   ```bash
   cp .env.production .env
   ```
4. Reiniciar la aplicación desde el panel de Node.js en cPanel.

## Herramientas de Diagnóstico

### Scripts de Diagnóstico
Se han incluido varios scripts para ayudar a diagnosticar problemas comunes:

1. **troubleshoot.js**: Diagnóstico completo del sistema
   ```bash
   node troubleshoot.js
   ```
   Este script verifica:
   - Archivos críticos del sistema
   - Variables de entorno
   - Conexión a la base de datos
   - Estructura de archivos

2. **check_passenger.js**: Verificación de la configuración de Passenger
   ```bash
   node check_passenger.js
   ```
   Este script verifica:
   - Configuración de Apache (.htaccess)
   - Archivo de inicio (passenger_app.js)
   - Configuración de puertos y CORS

3. **restart_app.sh**: Script para reiniciar la aplicación en cPanel
   ```bash
   bash restart_app.sh
   ```
   Este script:
   - Realiza una copia de seguridad de la configuración actual
   - Aplica la configuración de producción
   - Reinicia la aplicación Node.js

### Solución de Problemas Comunes

#### Error 503 (Service Unavailable)
Posibles causas:
- La aplicación Node.js no está ejecutándose
- Problemas con la configuración de Passenger
- Error en el archivo de inicio

Soluciones:
1. Verificar los logs de Apache en cPanel
2. Ejecutar `node troubleshoot.js` para diagnóstico completo
3. Verificar que Passenger está configurado correctamente en `.htaccess`

#### Error 500 en API
Posibles causas:
- Problemas de conexión a la base de datos
- Error en la ejecución de consultas
- Configuración incorrecta

Soluciones:
1. Verificar credenciales de la base de datos en `.env`
2. Ejecutar `node troubleshoot.js` para verificar la conexión
3. Revisar los logs de la aplicación

#### Problemas de CORS
Posibles causas:
- Configuración incorrecta de CORS
- Headers no configurados correctamente

Soluciones:
1. Verificar la configuración CORS en `src/config/default.js`
2. Revisar los headers en `.htaccess`

## Características Principales de la API

### Gestión de Noticias (news)

Endpoints para crear, leer, actualizar y eliminar noticias. 
(Detalles de estos endpoints pueden estar aquí o en una documentación de API más extensa)

### Gestión de Usuarios (users)

Endpoints para registro, login, y gestión de perfiles de usuario y roles.

### Gestión de Comunicaciones (com)

Esta funcionalidad permite a los usuarios autenticados (con rol 'usuario') crear entradas de comunicación que pueden incluir texto, un video y múltiples imágenes.

**Endpoints Principales para Comunicaciones:**

*   **`POST /api/v1/com`**: Crea una nueva entrada de comunicación.
    *   **Autenticación Requerida**: Sí (rol 'usuario').
    *   **Content-Type**: `multipart/form-data`.
    *   **Campos del Formulario (multipart/form-data):**
        *   `titulo` (string, requerido): Título de la comunicación.
        *   `descripcion` (string, requerido): Descripción o contenido principal.
        *   `video` (file, opcional): Archivo de video (límite 200MB).
        *   `image` (file[], opcional): Hasta 6 archivos de imagen (límite 10MB por imagen). Enviar como múltiples campos `image` o un array si el cliente lo soporta.
    *   **Respuesta Exitosa (201 Created)**: Objeto JSON con los detalles de la comunicación creada, incluyendo `id`, `titulo`, `descripcion`, `user_id`, `video_url` (string), `image_url` (string JSON de URLs), `image_urls` (array de strings, más conveniente para el frontend), `created_at`, `updated_at`.

*   **`GET /api/v1/com`**: Obtiene una lista de todas las comunicaciones.
    *   **Autenticación Requerida**: No (o sí, según se configure en la ruta).
    *   **Respuesta Exitosa (200 OK)**: Objeto JSON con una propiedad `data` que es un array de objetos de comunicación. Cada objeto incluirá `image_urls` (array) si existen imágenes.

*   **`GET /api/v1/com/:id`**: Obtiene una comunicación específica por su ID.
    *   **Autenticación Requerida**: No (o sí, según se configure).
    *   **Respuesta Exitosa (200 OK)**: Objeto JSON con los detalles de la comunicación, incluyendo `image_urls` (array) si existen imágenes.

*   **`PUT /api/v1/com/:id`**: Actualiza una comunicación existente.
    *   **Autenticación Requerida**: Sí (propietario de la comunicación o rol 'administrador'/'editor').
    *   **Content-Type**: `multipart/form-data` (si se envían campos de texto) o `application/json` (si solo se envían URLs como texto).
    *   **Campos (ej. para texto):** `titulo`, `descripcion`, `image_url` (string), `video_url` (string).
    *   **Respuesta Exitosa (200 OK)**: Objeto JSON con la comunicación actualizada.

*   **`DELETE /api/v1/com/:id`**: Elimina una comunicación por su ID (y los archivos asociados del servidor).
    *   **Autenticación Requerida**: Sí (propietario o rol 'administrador'/'editor').
    *   **Respuesta Exitosa (204 No Content)**.

### Documentación Dinámica de Endpoints (docs)

*   **`GET /api/v1/docs/endpoints`**: Obtiene una lista de todos los endpoints disponibles en la API, extraídos de la especificación OpenAPI generada. 
    *   **Autenticación Requerida**: Sí (rol 'administrador').
    *   **Respuesta Exitosa (200 OK)**: Array de objetos, cada uno describiendo un endpoint (`method`, `path`, `summary`, `tags`).

## Cambios Recientes

### Mejoras de Estabilidad
- Mejor manejo de errores en la conexión a la base de datos
- Implementación de reintentos de conexión
- Optimización de configuración CORS

### Corrección de Rutas API
- Configuración correcta de rutas API en `.htaccess`
- Mejora en la gestión de solicitudes OPTIONS (preflight)
- Corrección de redirecciones para archivos estáticos

### Optimización de Recursos
- Configuración de límites de memoria en `passenger_app.js`
- Mejora en la gestión de GC para reducir el consumo de memoria

## Contribución
1. Crear una rama para tu característica (`git checkout -b feature/nueva-caracteristica`)
2. Hacer commit de tus cambios (`git commit -m 'Añade nueva característica'`)
3. Hacer push a la rama (`git push origin feature/nueva-caracteristica`)
4. Crear un Pull Request 