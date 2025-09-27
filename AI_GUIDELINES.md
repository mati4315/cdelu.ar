# AI_GUIDELINES

## Resumen del Proyecto

- **Nombre**: CdelU - Portal de Noticias API
- **Propósito**: Backend REST para un diario online con gestión de noticias, comunidad (com), feed unificado, autenticación JWT, encuestas, publicidad (ads), loterías y soporte para apps móviles.
- **Stack**:
  - Runtime: Node.js 16+
  - Framework: Fastify 5
  - Base de datos: MySQL (mysql2/promise)
  - Auth: @fastify/jwt con roles
  - Documentación: @fastify/swagger y @fastify/swagger-ui
  - CORS/Seguridad: @fastify/cors, @fastify/helmet
  - Subidas: @fastify/multipart, sharp (opcional), fluent-ffmpeg (opcional)
  - Otros: undici/axios, rss-parser, rate-limit (configurado, desactivado en dev)

## Estructura de Carpetas/Módulos

- `src/index.js` / `deploy/src/index.js`: bootstrap del servidor, manejo de errores globales, verificación de BD, scheduling RSS, workers.
- `src/app.js` / `src/app.minimal.js`: construcción de la app Fastify (plugins, Swagger, estáticos, hooks, rutas).
- `src/config/`:
  - `default.js`: configuración por entorno (port, db, jwt, rss, facebook, corsOrigin).
  - `database.js`: pool MySQL (mysql2/promise) y test de conexión.
  - `schema.sql`: esquema base de BD de ejemplo.
- `src/middlewares/`:
  - `auth.js`: `authenticate` (jwtVerify) y `authorize(roles)`.
  - `rateLimit.js`: registro de rate-limit (desactivado en dev vía skip=true).
  - `profileValidation.js`: validación de fotos de perfil y helper de rate limit para uploads.
- `src/routes/` (rutas legacy y utilitarias): `auth.js`, `news.js`, `users.js`, `stats.js`, `docs.routes.js`, `com.routes.js`, `feed.routes.js`, `mobile.routes.js`, `ads.routes.js`, `lottery.routes.js`, `profile.routes.js`, `admin.routes.js`.
- `src/features/` (enfoque feature-based consolidado):
  - `auth/`: `auth.routes.js`, `auth.controller.js`, `auth.service.js`, `auth.repository.js`, tests.
  - `news/`: `news.routes.js`, `news.controller.js`, `news.service.js`, `news.repository.js`, tests.
  - `users/`: `users.routes.js`, `users.controller.js`, `users.service.js`, `users.repository.js` (perfiles públicos y seguimiento).
  - `ads/`: `ads.routes.js`, `ads.controller.js`, `ads.service.js`, `ads.repository.js`.
  - `surveys/`: `surveys.routes.js`, `surveys.controller.js`, `surveys.service.js`, `surveys.repository.js`.
  - `facebook/`: `facebook.routes.js` (Facebook Live status).
- `src/controllers/` (algunos controladores legacy o transicionales): `authController.js`, `newsController.js`/`news.controller.js`, `userController.js`, `feedController.js`, `com.controller.js`, `adsController.js`, `lotteryController.js`.
- `src/services/`: `rssService.js`, `aiService.js`, `lotteryService.js`, `feedSyncService.js` (sincronización del content_feed).
- `public/`: estáticos, dashboard, uploads (`/uploads/com_media`, `/uploads/profile-pictures`).
- `Dockerfile` / `docker-compose.yml`: contenedores para app y MySQL.

Notas:
- En `src/app.js` se registran tanto rutas legacy en `src/routes/` como rutas feature-based en `src/features/**/`. Donde existen ambas (ej. news, auth, ads, surveys), preferir las rutas de `src/features/**`.

## APIs y Endpoints Detectados (principales)

- Sistema/Diagnóstico
  - `GET /health`
  - `GET /api/v1/status`
  - `GET /api/v1/docs` (Swagger UI)
  - `GET /api/v1/docs/endpoints` (admin)

- Autenticación (feature-based `src/features/auth` y legacy `src/routes/auth.js` conservan paths)
  - `POST /api/v1/auth/register`
  - `POST /api/v1/auth/login`
  - `GET /api/v1/auth/me` (auth)
  - `PUT /api/v1/auth/me` (auth)

- Usuarios (`src/routes/users.js`)
  - `GET /api/v1/users` (admin)
  - `GET /api/v1/users/profile` (auth)
  - `PUT /api/v1/users/:id` (admin)
  - `DELETE /api/v1/users/:id` (admin)

- Perfiles Públicos y Seguimiento (feature-based `src/features/users/users.routes.js`)
  - Perfiles: `GET /api/v1/users/profile/:username` — Obtener perfil público por username
  - Posts: `GET /api/v1/users/profile/:username/posts` — Posts públicos del usuario (con likes si está autenticado)
  - Seguimiento: `POST /api/v1/users/:id/follow` (auth), `DELETE /api/v1/users/:id/follow` (auth)
  - Relaciones: `GET /api/v1/users/profile/:username/followers`, `GET /api/v1/users/profile/:username/following`
  - Búsqueda: `GET /api/v1/users/search?query=nombre` — Buscar usuarios por nombre o username

- Noticias (feature-based `src/features/news/news.routes.js` y legacy `src/routes/news.js`) — Incluye **comments_count** en respuestas
  - `GET /api/v1/news`
  - `GET /api/v1/news/:id`
  - `POST /api/v1/news` (auth usuario/colaborador/administrador)
  - `PUT /api/v1/news/:id` (colaborador/administrador)
  - `DELETE /api/v1/news/:id` (administrador)
  - Likes: `POST /api/v1/news/:id/like` (auth), `DELETE /api/v1/news/:id/like` (auth)
  - Comentarios: `POST /api/v1/news/:id/comments` (auth), `GET /api/v1/news/:id/comments`
  - Importación: `POST /api/v1/news/import` (colaborador/administrador), `GET /api/v1/news/import/stream` (colaborador/administrador)

- Feed Unificado (`src/routes/feed.routes.js`) — Incluye información de usuario (user_id, user_name, user_profile_picture) y **comments_count**
  - `GET /api/v1/feed` (query: page, limit, type, sort, order, includeAds)
  - `GET /api/v1/feed/noticias`
  - `GET /api/v1/feed/comunidad`
  - `GET /api/v1/feed/:type/:id`
  - `GET /api/v1/feed/:id`
  - Likes estado: `GET /api/v1/feed/likes/status` (auth)
  - Likes del usuario: `GET /api/v1/feed/likes/my` (auth)
  - Like/unlike por feedId: `POST /api/v1/feed/:feedId/like` (auth), `DELETE /api/v1/feed/:feedId/like` (auth), `POST /api/v1/feed/:feedId/like/toggle` (auth)
  - Comentarios por feedId: `POST /api/v1/feed/:feedId/comments` (auth), `GET /api/v1/feed/:feedId/comments`
  - Sincronización: `POST /api/v1/feed/sync` (admin)
  - Búsqueda por original: `GET /api/v1/feed/by-original-id/:type/:originalId`

- Comunicaciones/Comunidad (`src/routes/com.routes.js`)
  - `POST /api/v1/com` (auth; multipart: titulo, descripcion, video?, image[]?)
  - `GET /api/v1/com`
  - `GET /api/v1/com/:id`
  - `PUT /api/v1/com/:id` (auth)
  - `DELETE /api/v1/com/:id` (auth)

- Publicidad/Ads (feature-based `src/features/ads/ads.routes.js` y `src/routes/ads.routes.js`)
  - Públicos: `GET /api/v1/ads/active`, `POST /api/v1/ads/:id/impression`, `POST /api/v1/ads/:id/click`
  - Admin: `GET /api/v1/ads`, `GET /api/v1/ads/:id`, `POST /api/v1/ads`, `PUT /api/v1/ads/:id`, `DELETE /api/v1/ads/:id`, `GET /api/v1/ads/stats`

- Encuestas/Surveys (feature-based `src/features/surveys`)
  - `GET /api/v1/surveys`
  - `GET /api/v1/surveys/active`
  - `GET /api/v1/surveys/:id`
  - `GET /api/v1/surveys/:id/stats`
  - `POST /api/v1/surveys/:id/vote` (auth)
  - Admin: `POST /api/v1/surveys`, `PUT /api/v1/surveys/:id`, `DELETE /api/v1/surveys/:id`

- Loterías (`src/routes/lottery.routes.js`)
  - Públicas: `GET /api/v1/lotteries`, `GET /api/v1/lotteries/:id`, `GET /api/v1/lotteries/:id/winners`, `GET /api/v1/lotteries/:id/stats`, `GET /api/v1/lotteries/:id/sold-tickets`
  - Auth: `POST /api/v1/lotteries/:id/buy`, `GET /api/v1/lotteries/:id/tickets`, `GET /api/v1/lotteries/:id/my-tickets`, `GET /api/v1/lotteries/user/history`, `GET /api/v1/lotteries/user/wins`, `POST /api/v1/lotteries/:id/reserve`, `PUT /api/v1/lotteries/:id/cancel`, `DELETE /api/v1/lotteries/:id`
  - Admin: `POST /api/v1/lotteries`, `PUT /api/v1/lotteries/:id`, `POST /api/v1/lotteries/:id/finish`

- Facebook Live (`src/features/facebook/facebook.routes.js`)
  - `GET /api/v1/facebook/live-status` (mock opcional por query/config)

- Perfil (`src/routes/profile.routes.js`) con `prefix: /api/v1/profile`
  - `POST /api/v1/profile/picture` (auth; multipart profile_picture)
  - `DELETE /api/v1/profile/picture` (auth)
  - `GET /api/v1/profile/me` (auth)
  - `GET /api/v1/profile/:userId`
  - `GET /api/v1/profile/me/posts` (auth) — Listar mis posts de comunidad
  - `GET /api/v1/profile/:userId/posts` — Listar posts de comunidad de un usuario
  - `PUT /api/v1/profile/me/posts/:postId` (auth) — Actualizar mi post (titulo/descripcion)
  - `DELETE /api/v1/profile/me/posts/:postId` (auth) — Eliminar mi post
  - `PUT /api/v1/profile/me/posts/:postId/media` (auth; multipart) — Actualizar media (imágenes/video) del post propio

- Administración (`src/routes/admin.routes.js`)
  - `GET /api/v1/admin/video-settings` (admin) — Obtener configuración global de video
  - `PUT /api/v1/admin/video-settings` (admin) — Actualizar configuración global de video

### Contratos y ejemplos de Perfil

#### Listar mis posts
GET `/api/v1/profile/me/posts`
- Query opcional: `page` (>=1), `limit` (1..100), `order` (`asc|desc`)
- Respuesta:
```json
{
  "data": [
    {
      "id": 1,
      "titulo": "...",
      "descripcion": "...",
      "image_url": null,
      "image_urls": [],
      "video_url": null,
      "created_at": "2025-01-01T00:00:00.000Z",
      "updated_at": "2025-01-01T00:00:00.000Z"
    }
  ],
  "pagination": { "total": 10, "page": 1, "limit": 10, "totalPages": 1 }
}
```

#### Listar posts de un usuario
GET `/api/v1/profile/:userId/posts`
- Query opcional: igual a la anterior
- Respuesta: igual a la anterior

#### Actualizar texto de mi post
PUT `/api/v1/profile/me/posts/:postId`
- Body JSON (enviar solo los campos a modificar):
```json
{ "titulo": "Nuevo título", "descripcion": "Nuevo contenido" }
```
- Respuesta: objeto del post (mismos campos que en listado)

#### Eliminar mi post
DELETE `/api/v1/profile/me/posts/:postId`
- Respuesta:
```json
{ "message": "Entrada eliminada correctamente" }
```

#### Actualizar media (imágenes/video) de mi post
PUT `/api/v1/profile/me/posts/:postId/media` (multipart/form-data)
- Campos (FormData):
  - `image`: 1 o varias imágenes (repetir campo)
  - `video`: 1 archivo de video (opcional)
  - `remove_video`: "true" para eliminar el video actual
  - `remove_images`: CSV de nombres/paths a eliminar (p.ej. `old1.jpg,old2.webp`)
- Límites y MIME:
  - Imágenes: hasta 6, máx 10MB c/u; tipos permitidos: `image/jpeg`, `image/jpg`, `image/png`, `image/webp`
  - Video: 1, máx 200MB; tipo permitido: `video/mp4`
- Respuesta: objeto del post (incluye `image_urls` y `image_url` primera)

Ejemplo (fetch):
```js
const fd = new FormData();
images.forEach(img => fd.append('image', img));
// fd.append('video', videoFile);
fd.append('remove_video', 'true');
fd.append('remove_images', 'old1.jpg,old2.webp');

const res = await fetch(`/api/v1/profile/me/posts/${postId}/media`, {
  method: 'PUT',
  headers: { Authorization: `Bearer ${token}` },
  body: fd
});
const data = await res.json();
```

### Notas y reglas de Perfil
- Todos los endpoints `/me/*` requieren JWT válido.
- El usuario solo puede modificar/eliminar posts propios; de lo contrario, 403.
- En respuestas se normaliza `image_url` (primera imagen) y `image_urls` (todas).
- Errores:
  - 400: validación (tamaño o MIME no permitido)
  - 401: no autenticado
  - 403: sin permisos
  - 404: post no encontrado

### Contratos del Feed: comments_count

Todos los endpoints del feed incluyen automáticamente el campo `comments_count`:

**Ejemplo de respuesta del feed:**
```json
{
  "data": [
    {
      "id": 27,
      "titulo": "Mi publicación",
      "descripcion": "Contenido...",
      "likes_count": 5,
      "comments_count": 12,  // ⭐ Contador de comentarios
      "type": 2,
      "user_id": 123,
      "user_name": "usuario123",
      "is_liked": false
    }
  ],
  "pagination": { "total": 50, "page": 1, "limit": 10, "totalPages": 5 }
}
```

**Crear comentario:**
```bash
# En feed unificado:
POST /api/v1/feed/:feedId/comments
# En noticias específicas:
POST /api/v1/news/:id/comments

# Ambos responden con contador actualizado:
{
  "id": 456,
  "comments_count": 13,  // ⭐ Contador actualizado tras crear
  "message": "Comentario creado correctamente"
}
```

**Notas:**
- El contador se actualiza automáticamente via triggers SQL.
- Se incluye en todos los endpoints: `/feed`, `/feed/noticias`, `/feed/comunidad`, `/feed/by-original-id/`, etc.
- Conteo separado por tipo: `comments` (noticias) y `com_comments` (comunidad).

## Contratos de Perfiles Públicos y Seguimiento

### Obtener perfil público
`GET /api/v1/users/profile/:username` (público, con info adicional si está autenticado)

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "nombre": "Juan Pérez",
    "username": "juan.perez",
    "email": "juan@example.com",  // solo para el propio usuario o admins
    "profile_picture_url": "/uploads/profiles/juan.jpg",
    "bio": "Desarrollador Frontend en Vue.js",
    "location": "Concepción del Uruguay",
    "website": "https://juanperez.dev",
    "created_at": "2024-01-15T10:30:00Z",
    "is_verified": false,
    "stats": {
      "followers_count": 156,
      "following_count": 89,
      "posts_count": 45
    },
    "is_following": true,      // solo si usuario está autenticado
    "is_own_profile": false    // solo si usuario está autenticado
  }
}
```

### Obtener posts públicos de un usuario
`GET /api/v1/users/profile/:username/posts?page=1&limit=10&order=desc`

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 456,
      "titulo": "Mi primera noticia",
      "descripcion": "Descripción del post...",
      "image_url": "/uploads/posts/image1.jpg",
      "image_urls": ["/uploads/posts/image1.jpg", "/uploads/posts/image2.jpg"],
      "video_url": "/uploads/posts/video1.mp4",
      "created_at": "2024-09-20T15:30:00Z",
      "updated_at": "2024-09-20T15:30:00Z",
      "likes_count": 24,
      "comments_count": 8,
      "is_liked": false,  // solo si usuario está autenticado
      "autor": "Juan Pérez",
      "user_id": 123
    }
  ],
  "pagination": { "page": 1, "limit": 10, "total": 45, "totalPages": 5 }
}
```

### Sistema de seguimiento
`POST /api/v1/users/:id/follow` y `DELETE /api/v1/users/:id/follow` (requiere autenticación)

**Respuesta:**
```json
{
  "success": true,
  "message": "Ahora sigues a Juan Pérez",
  "data": {
    "is_following": true,
    "followers_count": 157
  }
}
```

### Listas de seguidores/siguiendo
`GET /api/v1/users/profile/:username/followers` y `GET /api/v1/users/profile/:username/following`

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 789,
      "nombre": "María García",
      "username": "maria.garcia",
      "profile_picture_url": "/uploads/profiles/maria.jpg",
      "bio": "Diseñadora UX/UI",
      "is_following": true,  // si el usuario actual sigue a este usuario
      "followed_at": "2024-08-15T10:30:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 156, "totalPages": 8 }
}
```

### Búsqueda de usuarios
`GET /api/v1/users/search?query=juan&page=1&limit=20`

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "nombre": "Juan Pérez",
      "username": "juan.perez",
      "profile_picture_url": "/uploads/profiles/juan.jpg",
      "bio": "Desarrollador Frontend",
      "followers_count": 156,
      "is_following": false,
      "is_verified": false
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 3, "totalPages": 1 }
}
```

- Móvil (`src/routes/mobile.routes.js`)
  - `GET /api/v1/mobile/config`, `GET /api/v1/mobile/health`, `GET /api/v1/mobile/feed`
  - `POST /api/v1/mobile/login` (mock de respuesta)

## Funciones Clave

- Controladores (feature-based preferidos):
  - `features/auth/auth.controller.js`: register, login, getMe, updateMe
  - `features/news/news.controller.js`: getNews, getNewsById, createNews, updateNews, deleteNews, importNews, importNewsStream, likeNews, unlikeNews, createComment, listComments
  - `features/users/users.controller.js`: getPublicProfile, getUserPosts, followUser, unfollowUser, getFollowers, getFollowing, searchUsers
  - `features/ads/ads.controller.js`: getActiveAds, getAllAds, getAdById, createAd, updateAd, deleteAd, registerImpression, registerClick, getAdStats
  - `features/surveys/surveys.controller.js`: list, get, stats, create/update/delete, vote
  - `controllers/feedController.js`: getFeed, getFeedItem, getFeedStats, syncFeed, mixAdsWithContent (incluye user_id, user_name, user_profile_picture)
  - `controllers/com.controller.js`: createComEntry, getAllComEntries, getComEntryById, updateComEntry, deleteComEntry
  - `controllers/userController.js`: uploadProfilePicture, removeProfilePicture, getUserProfile, getPublicUserProfile
  - Legacy: `controllers/authController.js`, `routes/news.js`, `routes/auth.js` (mantienen paths)

- Middlewares:
  - `middlewares/auth.js`: `authenticate`, `authorize(roles)`
  - `middlewares/rateLimit.js`: `registerRateLimit(fastify)` (skip=true en dev)
  - `middlewares/profileValidation.js`: `validateProfilePicture`, `requireAuthentication`, constantes de validación

- Servicios:
  - `services/rssService.js`: `importNewsFromRSS`, `scheduleRSSImport`
  - `services/aiService.js`: `generateSummary`, `generateTitle` usando DeepSeek (requiere `DEEPSEEK_API_KEY`)
  - `services/feedSyncService.js`: `syncAll`, `syncNews`, `syncCommunity`, `syncItem` para sincronizar content_feed automáticamente. **CRÍTICO**: Usa `u.username as user_name` para navegación de perfiles públicos.

## Dependencias Importantes

- Fastify y plugins: `fastify`, `@fastify/jwt`, `@fastify/cors`, `@fastify/helmet`, `@fastify/static`, `@fastify/swagger`, `@fastify/swagger-ui`, `@fastify/multipart`, `@fastify/rate-limit`.
- MySQL: `mysql2`
- Seguridad/Autenticación: `jsonwebtoken`, `bcryptjs`/`bcrypt`
- RSS: `rss-parser`
- HTTP: `undici`, `axios`
- Multimedia: `sharp` (opcional), `fluent-ffmpeg`, `@ffmpeg-installer/ffmpeg` (opcionales)
- Tests: `jest`, `supertest`

## Configuración Crítica

- Variables de entorno (ver `README.md` y `src/config/default.js`):
  - DB: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
  - JWT: `JWT_SECRET`, `JWT_EXPIRES_IN`
  - Server: `PORT`, `NODE_ENV`
  - CORS: `CORS_ORIGIN` (coma-separado o `*`)
  - RSS: `RSS_ENABLED`, `RSS_FEED_URL`, `RSS_INTERVAL_MINUTES`
  - Facebook: `FB_PAGE_ID`, `FB_PAGE_TOKEN`, `FB_GRAPH_VERSION`, mocks opcionales
  - DeepSeek: `DEEPSEEK_API_KEY`
- `src/config/database.js`: límites de pool bajos, keepAlive, timeouts, dateStrings, etc. Adecuado para hosting compartido.
- `rateLimit`: desactivado en dev (skip=true). Activar en producción.

## Reglas IA-Friendly (convenciones)

- Preferir enfoque feature-based (`src/features/**`) para nuevas funcionalidades. Mantener paths actuales de la API (`/api/v1/...`).
- Reutilizar middlewares `authenticate` y `authorize(roles)` para proteger rutas.
- Siempre definir `schema` en rutas (tags, summary, params, body, response) para Swagger y validación.
- Usar `pool` de `src/config/database.js` o repositorios/servicios existentes. Manejar conexiones con `getConnection()` cuando sea necesario y `release()` en finally.
- Evitar romper compatibilidad: donde haya rutas legacy y feature, documentar y, si se migra, mantener paths.
- No introducir dependencias pesadas si hay alternativas opcionales (sharp/ffmpeg son opcionales y protegidos con try/catch).
- Gestión de archivos: guardar en `public/uploads/...` y exponer con `@fastify/static`. Validar tipos y tamaños.
- Manejo de errores: usar el handler global de `app.js` y retornar códigos/estructuras consistentes (`error`, `message`, `code`).
- CORS: respetar `config.corsOrigin`. No hardcodear orígenes.
- Lint/Tests: mantener compatibilidad con Jest si agregas tests. No introducir linter errors.
- Performance: no bloquear el event loop con operaciones de CPU pesadas; cuando sea posible, usar streams o procesamientos opcionales.
- **Feed Sync**: NUNCA modificar `content_feed` manualmente. Usar `feedSyncService.js` y verificar que use `username` para `user_name`.

## Archivos Protegidos (no modificar sin instrucción explícita)

- `src/app.js`, `src/index.js` (arranque, hooks globales, Swagger, JWT, CORS, rate limit).
- `src/config/default.js`, `src/config/database.js` (config general y pool).
- `public/` (no sobrescribir archivos existentes sin necesidad; solo agregar uploads en subcarpetas designadas).
- `src/features/**` rutas y controladores existentes (modificar solo para bugs o extensiones claras).
- `Dockerfile`, `docker-compose.yml` (deployment básico).

## Ejemplo: Agregar una nueva ruta siguiendo convenciones

Objetivo: Crear `GET /api/v1/news/search` que busque noticias por `q` y `limit`.

1) Implementar en enfoque feature-based: `src/features/news/news.routes.js` utilizando el controlador de `features/news/news.controller.js` o crear un método nuevo en el service si hace falta.

```js
// En src/features/news/news.routes.js
fastify.get('/api/v1/news/search', {
  schema: {
    tags: ['Noticias'],
    summary: 'Buscar noticias por texto',
    querystring: {
      type: 'object',
      required: ['q'],
      properties: {
        q: { type: 'string', minLength: 2 },
        limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 }
      }
    }
  }
}, ctrl.searchNews);
```

2) En el controlador feature-based, delegar en el service para la consulta parametrizada evitando SQL injection.

```js
// En src/features/news/news.controller.js
async function searchNews(request, reply) {
  const { q, limit = 10 } = request.query;
  const res = await service.searchNews(q, limit);
  return reply.send(res);
}
module.exports = { /* ...otros métodos..., */ searchNews };
```

3) En el service, usar `pool.execute` con placeholders y, si aplica, índices adecuados en la BD.

```js
// En src/features/news/news.service.js
const pool = require('../../config/database');
async function searchNews(q, limit) {
  const like = `%${q}%`;
  const [rows] = await pool.execute(
    `SELECT id, titulo, descripcion, image_url, created_at
     FROM news
     WHERE titulo LIKE ? OR descripcion LIKE ?
     ORDER BY created_at DESC
     LIMIT ?`,
    [like, like, Number(limit)]
  );
  return { data: rows };
}
module.exports = { /* ...otros métodos..., */ searchNews };
```

4) Actualizar Swagger automáticamente al definir `schema` en la ruta (ya se expone en `/api/v1/docs`).

5) Validar con pruebas o curl:

```bash
curl "http://localhost:3001/api/v1/news/search?q=energia&limit=5"
```

## Notas Finales

- Antes de modificar o agregar endpoints, leer este archivo y respetar convenciones.
- Si agregas nuevas features, documenta sus rutas en esta guía y en Swagger (`schema`).
- Si una ruta legacy se reemplaza por feature-based, mantener la compatibilidad de paths.

## Convenciones de Respuesta

- Formatos típicos:
```json
{ "success": true, "data": { /* payload */ } }
{ "data": [ /* lista */ ], "pagination": { "total": 0, "page": 1, "limit": 10, "totalPages": 0 } }
{ "error": "Mensaje de error", "message": "Detalle opcional", "code": "IDENTIFICADOR" }
```
- Headers globales: `X-API-Version`, `X-Response-Time` agregados por hooks.
- Para endpoints protegidos incluir `security: [{ bearerAuth: [] }]` en `schema`.

## Paginación y Filtros

- Query estándar: `page` (>=1), `limit` (1..100), `sort`, `order` (`asc|desc`).
- Respuesta con `pagination.total`, `pagination.page`, `pagination.limit`, `pagination.totalPages`. Opcional: `hasNext`, `hasPrev` (móvil/feed ya lo usan).
- Ordenar por campos explícitos y validados (whitelist) para evitar SQL injection.

## Errores y Códigos

- Validación: 400 + `{ error: 'Error de validación', details: [...] }`.
- Auth/JWT: 401 + `{ error: 'No autorizado', code: 'JWT_ERROR' }`.
- Permisos: 403 + `{ error: 'No tienes permiso...' }`.
- No encontrado: 404 + `{ error: '... no encontrado' }`.
- Rate limit: 429 + `{ error: 'Demasiadas solicitudes', retryAfter: <seg> }`.
- BD: 500 + `{ error: 'Error de base de datos', code: 'ER_...' }`.
- Genérico: 500 + `{ error: 'Error en el servidor', code: 'INTERNAL_SERVER_ERROR' }`.
- Usar el handler global de `app.js` siempre que sea posible.

## Seguridad

- Autenticación: `authenticate` y `authorize(['rol'])` en `onRequest`.
- CORS: usar `config.corsOrigin`; no hardcodear.
- Subidas: validar tipo y tamaño (profile/com ya lo aplican). Límite global multipart: 200MB por archivo.
- Rate limiting: activarlo en producción ajustando `skip` en `middlewares/rateLimit.js`.
- Evitar exponer datos sensibles (hash de password, tokens) en respuestas.

## Convenciones de Nombres

- Archivos: `kebab-case` para rutas (`*.routes.js`), `camelCase` para funciones, `PascalCase` para clases.
- Feature-based: `src/features/<feature>/<feature>.(routes|controller|service|repository).js`.
- Variables: descriptivas, en inglés o español consistente (el proyecto mezcla español para campos de dominio; mantener consistencia local).

## Convenciones de Commits

- Prefijo sugerido: `Add:`, `Fix:`, `Refactor:`, `Docs:`, `Chore:`, `Test:`.
- Mensaje corto en primera línea; detalles en líneas siguientes si aplica.

## Checklist para nuevas Rutas/Servicios

1) ¿Existe feature? Crear/usar `src/features/<feature>/`.
2) Ruta con `schema` completo (tags, summary, params, body, response) y, si corresponde, `security`.
3) Autorización adecuada (`authenticate`, `authorize`). Rutas públicas explícitas.
4) Acceso a BD con `pool.execute/query` y placeholders. Cerrar conexiones (`release`) cuando se usen manualmente.
5) Respuestas con los formatos estándar y manejo de errores esperado.
6) Añadir a Swagger (al definir `schema` queda incluido automáticamente).
7) Si afecta al frontend, mantener paths existentes (`/api/v1/...`).
8) Si sube archivos, validar tipo/tamaño y guardar en `public/uploads/...`.
9) Actualizar esta guía (sección Endpoints y/o reglas si aplica).

## Matriz de Permisos (resumen)

- Público: GET `/health`, `/api/v1/feed` (GET), `/api/v1/news` (GET), `/api/v1/com` (GET), `/api/v1/facebook/live-status`, endpoints móviles GET y docs UI, **perfiles públicos** (`/api/v1/users/profile/:username`, `/api/v1/users/search`, listas de seguidores/siguiendo).
- Usuario autenticado: like/unlike/comentar, `/api/v1/auth/me`, `/api/v1/users/profile`, `/api/v1/profile/*`, compra/consulta de tickets de lotería, feed likes status/my, **sistema de seguimiento** (follow/unfollow usuarios).
- Colaborador: crear/importar/editar noticias, algunas operaciones de contenido.
- Administrador: gestión de usuarios, anuncios (ads admin), sincronización feed, encuestas admin, endpoints de estadísticas, administración de loterías.

## Base de Datos

- Usar `pool` de `src/config/database.js`.
- Preferir `pool.execute` con placeholders. Evitar concatenación de SQL.
- Cuando se usa `getConnection()`, liberar con `connection.release()` en `finally`.
- Índices: si agregas búsquedas nuevas, documentar necesidad de índices.

### Tablas principales

**Usuarios y perfiles:**
- `users`: tabla principal de usuarios (incluye username, bio, location, website, is_verified, profile_picture_url, role_id)
- `roles`: roles del sistema (administrador, colaborador, usuario)
- `user_follows`: relaciones de seguimiento entre usuarios (follower_id, following_id)

**Contenido:**
- `news`: noticias del sistema
- `com`: posts de comunidad de usuarios  
- `content_feed`: feed unificado que combina news y com con información de usuario
  - **CRÍTICO**: `user_name` debe contener el `username` (NO `nombre`) para navegación de perfiles públicos
  - Campos clave: `user_id`, `user_name` (username), `user_profile_picture`, `type` (1=news, 2=community)
  - Sincronizado via `feedSyncService.js` - NO modificar manualmente

**Interacciones:**
- `likes`: likes en noticias
- `com_likes`: likes en posts de comunidad
- `comments`: comentarios en noticias (news_id)
- `com_comments`: comentarios en posts de comunidad (com_id)

### Sistema de Comentarios y Triggers

**Tablas de comentarios:**
- `comments`: comentarios en noticias (`user_id`, `news_id`, `content`, `created_at`)
- `com_comments`: comentarios en comunidad (`user_id`, `com_id`, `content`, `created_at`)

**Triggers automáticos (CRÍTICOS):**
- `after_comments_insert/delete`: actualiza `content_feed.comments_count` para noticias (type=1)
- `after_com_comments_insert/delete`: actualiza `content_feed.comments_count` para comunidad (type=2)
- Los triggers usan `pool.query()` para creación (NO `pool.execute()`)

**Sincronización automática:**
- `content_feed.comments_count` se actualiza automáticamente via triggers
- NO modificar manualmente este campo
- Los endpoints devuelven `comments_count` actualizado tras crear/eliminar comentarios

**Endpoints con `comments_count`:**
- Todos los endpoints del feed incluyen automáticamente este campo
- `POST /api/v1/news/:id/comments` y `POST /api/v1/feed/:feedId/comments` devuelven contador actualizado

## Uploads y Archivos Estáticos

- Guardar en `public/uploads/<contexto>/...`.
- Exponer con `@fastify/static` (ya configurado).
- Validar MIME/size; para imágenes preferir conversión optimizada (sharp si disponible).
- No sobrescribir ficheros existentes: generar nombres únicos (`Date.now() + random`).

## Performance y Estabilidad

- Evitar loops pesados en el request path; paginar siempre.
- Liberar conexiones de BD; usar consultas específicas (SELECT con columnas necesarias).
- En hosting compartido, mantener límites (memoria, pool, timeouts) y evitar WASM.

## Testing

- Framework: Jest/Supertest (ya configurados).
- Para nuevas rutas, agregar al menos un test de éxito y uno de error.
- Tests no deben depender de estado productivo; usar datos controlados.

## Logging y Monitoreo

- Fastify logger activo (`logger: true`).
- Usar `request.log.error/info` en controladores ante errores y eventos relevantes.
- Evitar loguear datos sensibles.

## Versionado de API

- Mantener el prefijo `/api/v1/`.
- Cambios breaking: agregar nueva versión de path (`/api/v2`) y deprecación progresiva.

## Troubleshooting y Problemas Conocidos

### Sistema de Perfiles Públicos

#### Problema: 404 en navegación de perfiles desde el feed
**Síntoma**: El frontend recibe 404 al hacer clic en perfiles de usuarios desde el feed.

**Causa común**: Discrepancia entre `user_name` en `content_feed` y usernames reales en tabla `users`.

**Diagnóstico**:
```sql
-- Verificar usernames en content_feed
SELECT DISTINCT user_id, user_name FROM content_feed WHERE user_name IS NOT NULL;

-- Verificar usernames reales en users
SELECT id, username FROM users WHERE id IN (SELECT DISTINCT user_id FROM content_feed);
```

**Solución**:
1. Verificar que `feedSyncService.js` use `u.username as user_name` (NO `u.nombre`)
2. Resincronizar content_feed:
```javascript
const feedSyncService = require('./src/services/feedSyncService');
await pool.execute('DELETE FROM content_feed');
await feedSyncService.syncAll();
```

**Prevención**: Al modificar `feedSyncService.js`, asegurar que todas las consultas usen `username` para navegación de perfiles.

### Content Feed

#### Problema: Información de usuario desactualizada en el feed
**Causa**: `content_feed` no se resincroniza automáticamente cuando cambian datos de usuario.

**Solución**: Ejecutar sincronización manual o implementar triggers en tabla `users`.

### Sistema de Comentarios

#### Problema: comments_count devuelve 0 o no se actualiza
**Síntoma**: Los contadores de comentarios muestran 0 o no se actualizan al crear/eliminar comentarios.

**Causa común**: Triggers faltantes o no funcionando.

**Diagnóstico**:
```sql
-- Verificar triggers existentes
SHOW TRIGGERS;

-- Verificar conteos manuales vs content_feed
SELECT 
  cf.original_id,
  cf.comments_count as feed_count,
  (SELECT COUNT(*) FROM comments WHERE news_id = cf.original_id) as manual_count
FROM content_feed cf 
WHERE cf.type = 1 AND cf.comments_count > 0;
```

**Solución**:
1. Crear triggers faltantes:
```sql
-- Para noticias
CREATE TRIGGER after_comments_insert
AFTER INSERT ON comments FOR EACH ROW
BEGIN
  UPDATE content_feed SET comments_count = (SELECT COUNT(*) FROM comments WHERE news_id = NEW.news_id)
  WHERE type = 1 AND original_id = NEW.news_id;
END;

-- Para comunidad  
CREATE TRIGGER after_com_comments_insert
AFTER INSERT ON com_comments FOR EACH ROW
BEGIN
  UPDATE content_feed SET comments_count = (SELECT COUNT(*) FROM com_comments WHERE com_id = NEW.com_id)
  WHERE type = 2 AND original_id = NEW.com_id;
END;
```

2. Recalcular manualmente:
```sql
-- Noticias
UPDATE content_feed cf SET comments_count = (
  SELECT COALESCE(COUNT(*), 0) FROM comments c WHERE c.news_id = cf.original_id
) WHERE cf.type = 1;

-- Comunidad
UPDATE content_feed cf SET comments_count = (
  SELECT COALESCE(COUNT(*), 0) FROM com_comments cc WHERE cc.com_id = cf.original_id  
) WHERE cf.type = 2;
```

**Prevención**: Los triggers son críticos. Usar `pool.query()` (no `pool.execute()`) para crearlos.

### Administración: Video Settings

#### Endpoints
- `GET /api/v1/admin/video-settings` (admin, requiere JWT)
  - Respuesta: `{ isVideoEnabled: boolean, lastModified: string, modifiedBy: string }`
- `PUT /api/v1/admin/video-settings` (admin, requiere JWT)
  - Body: `{ isVideoEnabled: boolean, modifiedBy: string }`
  - Respuesta: `{ success: true, settings: { isVideoEnabled, lastModified, modifiedBy } }`

#### Ejemplos (fetch)
```js
// Leer
const res = await fetch('/api/v1/admin/video-settings', {
  headers: { Authorization: `Bearer ${token}` }
});
const settings = await res.json();

// Guardar
await fetch('/api/v1/admin/video-settings', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({ isVideoEnabled: true, modifiedBy: currentUser.email })
});
```

#### Ejemplos (axios)
```js
// Leer
const { data: settings } = await axios.get('/api/v1/admin/video-settings', {
  headers: { Authorization: `Bearer ${token}` }
});

// Guardar
await axios.put('/api/v1/admin/video-settings', {
  isVideoEnabled: false,
  modifiedBy: currentUser.email
}, { headers: { Authorization: `Bearer ${token}` } });
```

#### Notas
- Persistencia en tabla `admin_settings` (clave `video_settings`).
- Campo `isVideoEnabled` controla renderizado de video en frontend.
- `lastModified` y `modifiedBy` para auditoría básica.

## Proceso para Actualizar esta Guía

- Toda nueva funcionalidad o cambio de contrato debe reflejarse aquí (sección Endpoints, Reglas o Checklists).
- Antes de implementar, leer esta guía. Después de implementar, actualizarla.
- Documentar problemas conocidos y sus soluciones en la sección Troubleshooting.
