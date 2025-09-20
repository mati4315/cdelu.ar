# Changelog

Todas las cambios notables a este proyecto serán documentadas en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/),
y este proyecto se adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2025-01-14

### Added - NUEVO: Soporte para Apps Móviles
- **📱 Endpoints Específicos para Apps Móviles**:
  - `GET /api/v1/mobile/config` - Configuración de la app móvil
  - `GET /api/v1/mobile/health` - Health check optimizado para móviles
  - `GET /api/v1/mobile/feed` - Feed optimizado para apps móviles
  - `POST /api/v1/mobile/login` - Login optimizado para apps móviles
  - **Respuestas optimizadas** con datos específicos para consumo móvil

- **🌐 CORS Mejorado para Apps Móviles**:
  - **Permitir todos los orígenes** (`*`) para apps móviles
  - **Headers específicos** para mejor rendimiento en móviles
  - **Configuración automática** que las apps pueden obtener al iniciar

- **📋 Guía Completa para Frontend Android**:
  - **`readme-android.md`** - Guía paso a paso para conectar apps Android
  - **Script de testing** (`test-mobile-api.js`) para verificar endpoints móviles
  - **Ejemplos de código** listos para copiar y pegar

### Changed
- **🔧 Configuración de CORS** actualizada para permitir conexiones desde apps móviles
- **📊 Headers de respuesta** mejorados con información específica para móviles
- **🛡️ Middleware de autenticación** actualizado para permitir endpoints móviles públicos

## [1.1.0] - 2025-01-14

### Fixed - CRÍTICO
- **🔧 SOLUCIÓN COMPLETA AL LOGIN (Error 500)**: 
  - **Agregado el registro del plugin JWT** en `src/app.js` y `src/app.minimal.js` que estaba faltando
  - El controlador de login ahora puede generar tokens JWT correctamente usando `reply.jwtSign()`
  - Configuración JWT carga desde `src/config/default.js` con secret y tiempo de expiración
  - **Login dashboard.html y login.html funcionan completamente**

- **🚀 SOLUCIÓN A ERRORES DE WEBASSEMBLY**: 
  - **Filtrado automático** de errores `RangeError: WebAssembly.instantiate(): Out of memory`
  - **Deshabilitado WebAssembly globalmente** en `passenger_app.js` con variables de entorno
  - **Corregido error `server.close is not a function`** en `src/index.js` - ahora usa `app.close()`
  - **Configuración anti-WASM** en package.json con scripts optimizados para cPanel
  - **Instalada versión específica de undici** (5.28.4) para mejor compatibilidad

### Added
- **📊 Endpoints de Diagnóstico Mejorados**:
  - `/health` - Health check básico
  - `/api/v1/status` - Diagnóstico completo con estado de BD y memoria
  - **Filtros inteligentes de errores** - Los errores de WebAssembly/undici se marcan como "ignorados"

- **⚙️ Configuración Optimizada para Hosting Compartido**:
  - **Límites de memoria** configurados a 512MB apropiados para cPanel
  - **Pool de conexiones reducido** a 5 conexiones máximo
  - **Variables de entorno** configuradas: `UNDICI_WASM=0`, `NODE_OPTIONS=--no-wasm`
  - **Scripts npm** específicos para cPanel: `start:cpanel`, `start:safe`, `start:minimal`

### Changed
- **🔄 Aplicación con Fallback Robusto**:
  - Si falla la app completa → carga automáticamente `app.minimal.js` (sin Swagger)
  - Si falla la mínima → servidor de emergencia ultra-básico
  - **Manejo resiliente** de errores de conexión de BD

- **📝 Documentación Actualizada**:
  - `INSTRUCCIONES_CPANEL_WEBASSEMBLY.md` - Guía completa para cPanel
  - **Logs más informativos** con códigos de error específicos
  - **Instrucciones paso a paso** para solucionar problemas

## [1.0.0] - 2025-01-13

### Added
- **Funcionalidad de Comunicaciones (Tabla `com`)**:
  - Nueva tabla `com` en la base de datos para almacenar comunicaciones de usuarios con título, descripción, y opcionalmente imagen y video.
  - Endpoints API (`/api/v1/com`) para Crear, Leer, Actualizar y Eliminar (CRUD) comunicaciones.
  - Implementación de subida de archivos (imagen/video) para la creación de comunicaciones, guardando archivos en el servidor y sus rutas en la BD.
  - **Soporte para subida simultánea de video y múltiples imágenes**: El endpoint `POST /api/v1/com` ahora permite subir un archivo de video y hasta 6 archivos de imagen en una sola petición.
  - Las URLs de las imágenes se almacenan como un JSON string en la columna `image_url` (requiere cambio de tipo a `TEXT` en la BD) y se devuelven como un array `image_urls` en las respuestas de la API.
  - Protección de rutas de creación/modificación/eliminación para requerir autenticación y roles específicos.
  - Actualización de esquemas de validación para `multipart/form-data` y manejo de la estructura de datos de `@fastify/multipart`.
  - Límites de tamaño de archivo configurados: 200MB para video, 10MB por imagen.
- **API Viewer Mejorado en Dashboard**:
  - Nuevo endpoint `/api/v1/docs/endpoints` (protegido para administradores) que expone dinámicamente todas las rutas de la API a partir de la especificación OpenAPI.
  - El "API Viewer" en `public/dashboard.html` ahora carga la lista de endpoints desde `/api/v1/docs/endpoints`, permitiendo una selección dinámica y actualizada.

### Changed
- Configuración de `@fastify/multipart` ajustada a `attachFieldsToBody: true` para un manejo más directo de los campos en los controladores.
- Esquemas de validación de rutas `multipart/form-data` actualizados para reflejar la estructura de `request.body` generada por `@fastify/multipart`.
- Refactorización de la lógica de guardado de archivos (`saveFile`) para usar el buffer interno (`_buf`) proporcionado por `@fastify/multipart` y manejar correctamente los streams.

### Fixed
- Resueltos problemas de validación de esquemas (`FST_ERR_VALIDATION`) en el endpoint `POST /api/v1/com` al asegurar que el esquema de la ruta coincida con la estructura del cuerpo de la solicitud procesada por `@fastify/multipart`.
- Corregido el uso de `$id` y `$ref` en los esquemas de Fastify para `com.routes.js` para una correcta resolución por `fastify-swagger`.
- **Solucionado el problema de archivos de 0KB**: Se corrigió la lógica de manejo de streams y buffers en `@fastify/multipart` y en la función `saveFile` para asegurar que los archivos se guarden con su contenido completo.
- Corrección en la ruta pública de los archivos guardados para asegurar que sean accesibles desde el frontend (prefijo `/public/`).
- Restablecido el plugin `@fastify/jwt` y el hook `onRequest` global para asegurar la autenticación en las rutas protegidas.
- Limpieza de logs de depuración verbosos en `com.controller.js`.

### Security
- Incrementado el límite de tamaño del payload general y de archivos individuales en `@fastify/multipart` para evitar errores `413 Payload Too Large` con archivos grandes.

---

## Notas de Migración

### Para usuarios existentes (v1.0.0 → v1.1.0):

1. **Subir archivos actualizados** a cPanel:
   - `passenger_app.js`
   - `src/app.js`
   - `src/app.minimal.js` 
   - `src/index.js`
   - `package.json`

2. **Ejecutar en cPanel**:
   ```bash
   npm install undici@5.28.4 --save
   ```

3. **Reiniciar aplicación** desde cPanel > Setup Node.js App

### Verificación:
- ✅ `/health` responde OK
- ✅ `/api/v1/status` muestra estado de BD
- ✅ Login funciona en dashboard.html
- ✅ Errores WebAssembly marcados como "ignorados" 