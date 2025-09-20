## Guía de Consumo de la API (CdelU)

Esta guía documenta todos los endpoints públicos de la API para que los equipos de frontend (web y mobile) puedan integrarse de manera rápida y segura.

- Base URL desarrollo: `http://localhost:3001`
- Base URL producción: `https://diario.trigamer.xyz`
- Documentación interactiva (Swagger UI): `/api/v1/docs`
- Catálogo de endpoints (JSON): `GET /api/v1/docs/endpoints` (solo admin)

### Autenticación

- Esquema: Bearer JWT
- Header: `Authorization: Bearer <token>`
- Obtención del token: `POST /api/v1/auth/login` o tras `POST /api/v1/auth/register`
- Expiración por defecto: 1 día (configurable vía `JWT_EXPIRES_IN`)

Ejemplo (curl):
```bash
curl -X POST "$BASE_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario@demo.com","password":"123456"}'
```

Ejemplo (axios):
```javascript
const { data } = await axios.post(`${BASE_URL}/api/v1/auth/login`, { email, password });
axios.defaults.headers.common.Authorization = `Bearer ${data.token}`;
```

### Headers globales y CORS

- La API añade headers informativos: `X-API-Version: 1.0.0`, `X-Response-Time: <ms>`
- CORS configurable por entorno. En dev permite orígenes locales y apps móviles; en prod sitios bajo `*.trigamer.xyz`.

### Rate limiting

- Está registrado pero desactivado en desarrollo. En producción se recomienda activarlo (ver `src/middlewares/rateLimit.js`).

### Manejo de errores (resumen)

Formato común de error:
```json
{ "error": "<tipo>", "message": "<detalle>", "code": "<opcional>", "timestamp": "<ISO>" }
```

Casos frecuentes:
- 400 VALIDATION_ERROR: datos inválidos en body/params.
- 401 JWT_ERROR / No autorizado: token faltante/expirado/incorrecto.
- 403: sin permisos por rol.
- 429: límite de peticiones excedido (si se activa rate limit).
- 5xx: errores internos o de base de datos.

### Versionado

- Prefijo estable: `/api/v1/...`

---

## Autenticación (Auth)

### POST /api/v1/auth/register
- Body: `{ nombre: string, email: string, password: string, rol?: 'administrador'|'colaborador'|'usuario' }` (por defecto `usuario`)
- 201: `{ message, user:{ id,nombre,email,rol,created_at }, token }`

### POST /api/v1/auth/login
- Body: `{ email: string, password: string }`
- 200: `{ message, user:{ id,nombre,email,rol }, token }`

### GET /api/v1/auth/me
- Requiere JWT.
- 200: `{ user:{ id,nombre,email,rol,created_at } }`

### PUT /api/v1/auth/me
- Requiere JWT.
- Body: `{ nombre?: string, email?: string }`

---

## Usuarios (Users)

### GET /api/v1/users
- Requiere rol `administrador`.
- 200: `{ data: Array<{ id,nombre,email,role,created_at }> }`

### GET /api/v1/users/profile
- Requiere JWT.
- 200: `{ id,nombre,email,role,created_at }`

### PUT /api/v1/users/:id
- Requiere rol `administrador`.
- Body (parcial): `{ nombre?, email?, role?: 'administrador'|'colaborador'|'usuario' }`

### DELETE /api/v1/users/:id
- Requiere rol `administrador` (no permite auto-eliminarse).

---

## Perfil (Profile)

Prefijo registrado: `/api/v1/profile`

### POST /api/v1/profile/picture
- Requiere JWT. `multipart/form-data` con campo `profile_picture` (≤ 5MB; tipos: jpg, png, webp).
- 200: `{ message, profile_picture_url }`

Ejemplo (curl):
```bash
curl -X POST "$BASE_URL/api/v1/profile/picture" \
  -H "Authorization: Bearer $TOKEN" \
  -F "profile_picture=@/ruta/imagen.jpg;type=image/jpeg"
```

### DELETE /api/v1/profile/picture
- Requiere JWT.

### GET /api/v1/profile/me
- Requiere JWT. 200: `{ user, stats? }`

### GET /api/v1/profile/:userId
- Público. 200: `{ user:{ id,nombre,rol,profile_picture_url?,created_at } }`

---

## Noticias (News)

### GET /api/v1/news
- Público. Query: `page`, `limit`, `sort` (`titulo|created_at|likes_count|comments_count`), `order` (`asc|desc`).
- 200: `{ data: [...], pagination: { total,page,limit,totalPages } }`

### GET /api/v1/news/:id
- Público. 200: `{ id,titulo,descripcion,resumen?,image_url?,original_url?,published_at?,is_oficial,created_by?,created_at,updated_at,autor? }`

### POST /api/v1/news
- Requiere JWT. Roles: `administrador|colaborador|usuario`.
- Body: `{ titulo, descripcion, image_url?, original_url?, is_oficial? }`

### PUT /api/v1/news/:id
- Requiere JWT. Roles: `administrador|colaborador`.

### DELETE /api/v1/news/:id
- Requiere JWT. Rol: `administrador`.

### Likes y comentarios en noticias
- POST `/api/v1/news/:id/like` (JWT)
- DELETE `/api/v1/news/:id/like` (JWT)
- POST `/api/v1/news/:id/comments` (JWT) Body: `{ content }`
- GET `/api/v1/news/:id/comments` (público)

---

## Feed unificado (News + Comunidad)

### GET /api/v1/feed
- Público. Query: `page`, `limit`, `type? (1=news,2=comunidad)`, `sort`, `order`.
- 200: `{ data:[{ id,titulo,descripcion,resumen?,image_url?,type,original_id,user_id?,user_name?,published_at?,created_at,updated_at,original_url?,is_oficial?,video_url?,likes_count,comments_count,is_liked }], pagination }`

### GET /api/v1/feed/noticias
### GET /api/v1/feed/comunidad
- Atajos que fuerzan `type=1` o `type=2`.

### GET /api/v1/feed/:type/:id
### GET /api/v1/feed/:id
- Obtiene un item específico (con `is_liked` si hay JWT).

### GET /api/v1/feed/likes/status
- Requiere JWT. Query: `ids=1,2,3`. 200: `{ statuses: { "id": boolean } }`

### GET /api/v1/feed/likes/my
- Requiere JWT. 200: `{ likedIds: number[] }`

### GET /api/v1/feed/stats
- Público. Métricas generales del feed.

### POST /api/v1/feed/:feedId/like
### DELETE /api/v1/feed/:feedId/like
### POST /api/v1/feed/:feedId/like/toggle
- Requiere JWT. Maneja likes para noticias (type=1) y comunidad (type=2).

### Comentarios en feed
- POST `/api/v1/feed/:feedId/comments` (JWT) Body: `{ content }`
- GET `/api/v1/feed/:feedId/comments` (público)

### POST /api/v1/feed/sync
- Requiere rol `administrador`. Sincroniza el feed manualmente.

### GET /api/v1/feed/by-original-id/:type/:originalId
- Busca por tipo (1 news, 2 comunidad) e ID original.

---

## Comunidad (com)

Las entradas de comunidad aceptan multipart para video/imagenes. Al estar `attachFieldsToBody` activo, los campos de texto llegan como objetos con `{ value }`.

### POST /api/v1/com
- Requiere JWT y rol `usuario`.
- multipart:
  - `titulo` (texto)
  - `descripcion` (texto)
  - `video` (archivo, opcional)
  - `image` (uno o varios archivos, opcional)
- 201: objeto de la entrada creada.

Ejemplo (curl):
```bash
curl -X POST "$BASE_URL/api/v1/com" \
  -H "Authorization: Bearer $TOKEN" \
  -F "titulo=Mi título" \
  -F "descripcion=Contenido de la publicación" \
  -F "image=@/ruta/foto1.jpg" \
  -F "image=@/ruta/foto2.jpg"
```

### GET /api/v1/com
- Público. Lista entradas.

### GET /api/v1/com/:id
- Público. Detalle.

### PUT /api/v1/com/:id
- Requiere JWT. Roles: `usuario|administrador|editor`.

### DELETE /api/v1/com/:id
- Requiere JWT. Roles: `usuario|administrador|editor`.

---

## Publicidad (Ads)

### GET /api/v1/ads/active
- Público. Query: `limit?`, `categoria?`. Devuelve anuncios activos para el feed.

### Endpoints de administración (requiere rol `administrador`)
- GET `/api/v1/ads` (paginación + filtros)
- GET `/api/v1/ads/:id`
- POST `/api/v1/ads`
- PUT `/api/v1/ads/:id`
- DELETE `/api/v1/ads/:id`
- GET `/api/v1/ads/stats`

### Eventos públicos
- POST `/api/v1/ads/:id/impression`
- POST `/api/v1/ads/:id/click`

---

## Loterías (Lotteries)

### GET /api/v1/lotteries
- Público. Filtros: `status`, `is_free`, `page`, `limit`, `user_id?`.

### GET /api/v1/lotteries/:id
- Público. Detalle con disponibilidad y tickets del usuario.

### POST /api/v1/lotteries (admin)
- Requiere rol `administrador`. Crea lotería.

### PUT /api/v1/lotteries/:id (admin)
- Requiere rol `administrador`. Actualiza lotería.

### POST /api/v1/lotteries/:id/buy
- Requiere JWT. Body: `{ ticket_numbers: number[] }`. Calcula importe según gratuita/paga.

### GET /api/v1/lotteries/:id/tickets
### GET /api/v1/lotteries/:id/my-tickets
- Requiere JWT. Lista tickets del usuario para esa lotería.

### POST /api/v1/lotteries/:id/finish (admin)
- Requiere rol `administrador`. Finaliza y selecciona ganadores.

### GET /api/v1/lotteries/:id/winners
- Público. Lista ganadores.

### GET /api/v1/lotteries/user/history
- Requiere JWT. Historial de participación del usuario.

### GET /api/v1/lotteries/user/wins
- Requiere JWT. Loterías ganadas por el usuario.

### POST /api/v1/lotteries/:id/reserve
- Requiere JWT. Reserva temporal de números. 200: `{ reserved_numbers, expires_at }`

### GET /api/v1/lotteries/:id/sold-tickets
- Público. Números vendidos.

### PUT /api/v1/lotteries/:id/cancel
- Requiere JWT (admin o creador). Cancela la lotería (si aplica).

### DELETE /api/v1/lotteries/:id
- Requiere JWT (admin o creador). Elimina la lotería.

---

## Móvil (Mobile)

### GET /api/v1/mobile/config
- Público. Config para apps (features y límites de subida).

### GET /api/v1/mobile/health
- Público. Health específico con timezone AR.

### GET /api/v1/mobile/feed
- Público. Feed optimizado. Query: `page`, `limit`, `type?`, `sort`, `order`.

### POST /api/v1/mobile/login
- Sólo para pruebas de conectividad (dev). Retorna `token` mock.

---

## Administración (Admin)

Requiere rol `administrador`.

- POST `/api/v1/admin/purge-cache`
- GET `/api/v1/admin/database/status`
- POST `/api/v1/admin/database/optimize`
- POST `/api/v1/admin/database/backup`
- GET `/api/v1/admin/system/status`
- POST `/api/v1/admin/system/clear-logs`
- POST `/api/v1/admin/system/restart`
- GET `/api/v1/admin/security/status`
- POST `/api/v1/admin/security/update-keys`
- GET `/api/v1/admin/security/rate-limits`
- POST `/api/v1/admin/security/block-ips`

---

## Estadísticas (Stats)

### GET /api/v1/stats
- Requiere rol `administrador`. Totales: noticias, usuarios, comentarios, feed, likes, comentarios de comunidad.

---

## Facebook Live

### GET /api/v1/facebook/live-status
- Público. Responde `{ isLive, videoId?, embedUrl?, hlsUrl?, title?, startedAt? }`.
- Modo mock (dev): `?mock=true&permalink=<url>&hls=<m3u8>`

---

## Sistema y utilidades

### GET /health
- Health check simple.

### GET /api/v1/status
- Diagnóstico extendido: estado de BD y memoria.

---

## Buenas prácticas de consumo

- Reutiliza el token JWT y refresca al expirar (nueva sesión de login).
- Controla estados 401/403 para redirigir a login o mostrar mensajes de permisos.
- Usa paginación (`page`, `limit`) y respeta `totalPages` cuando esté disponible.
- Para multipart, respeta tamaños/formatos: imágenes de perfil ≤ 5MB (jpg/png/webp). Para otros uploads, la API permite archivos grandes pero pueden existir límites por negocio.
- Envía siempre `Authorization` cuando un endpoint lo requiera; evita incluirlo en endpoints públicos.

---

## Snippets de integración

### Axios base
```javascript
import axios from 'axios';

export const api = axios.create({ baseURL: process.env.NODE_ENV === 'production' ? 'https://diario.trigamer.xyz' : 'http://localhost:3001' });

export function setToken(token) {
  api.defaults.headers.common.Authorization = `Bearer ${token}`;
}
```

### Listar feed paginado
```javascript
const { data } = await api.get('/api/v1/feed', { params: { page: 1, limit: 10 } });
```

### Crear noticia (usuario autenticado)
```javascript
await api.post('/api/v1/news', { titulo: 'Título', descripcion: 'Contenido...' });
```

### Like toggle en feed item
```javascript
const { data } = await api.post(`/api/v1/feed/${feedId}/like/toggle`);
```

### Subir foto de perfil (multipart)
```javascript
const form = new FormData();
form.append('profile_picture', file);
await api.post('/api/v1/profile/picture', form, { headers: { 'Content-Type': 'multipart/form-data' } });
```

---

Si algo no coincide con esta guía, revisa siempre la fuente de verdad en Swagger UI (`/api/v1/docs`).


