# Changelog

Todas las cambios notables a este proyecto serán documentadas en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/),
y este proyecto se adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - YYYY-MM-DD

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

## [Previous Version] - YYYY-MM-DD 
(Aquí irían las notas de versiones anteriores si las hubiera) 