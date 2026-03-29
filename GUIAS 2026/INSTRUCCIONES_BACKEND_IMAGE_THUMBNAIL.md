# 📋 Instrucciones para Backend Developer - Soporte de Miniaturas en Noticias

## 🎯 Objetivo
Implementar soporte para miniaturas de imágenes (`image_thumbnail_url`) en las noticias del sistema. Las miniaturas se cargarán en el listado y la imagen completa se mostrará en un modal al hacer click.

---

## 1️⃣ Migración de Base de Datos

### Ejecutar esta migración SQL en la tabla `news`:

```sql
-- Agregar campo de miniatura a la tabla news
ALTER TABLE news 
ADD COLUMN IF NOT EXISTS image_thumbnail_url VARCHAR(500) COMMENT 'URL de la miniatura de la imagen de portada';

-- Crear índice para optimizar búsquedas (opcional)
CREATE INDEX IF NOT EXISTS idx_image_thumbnail ON news(image_thumbnail_url);
```

**Nota:** Si ya existen registros sin miniatura, puedes copiar la imagen completa como fallback:
```sql
UPDATE news SET image_thumbnail_url = image_url WHERE image_thumbnail_url IS NULL;
```

---

## 2️⃣ Campos a Retornar en API

### Todos los endpoints que devuelven datos de noticias deben incluir:

```json
{
  "id": 1,
  "titulo": "Nombre de la noticia",
  "descripcion": "Descripción completa...",
  "image_url": "https://ejemplo.com/imagen-completa.jpg",
  "image_thumbnail_url": "https://ejemplo.com/imagen-miniatura.jpg",
  "original_url": "https://...",
  "is_oficial": true,
  "autor": "Nombre del autor",
  "likes_count": 42,
  "comments_count": 5,
  "created_at": "2026-03-29T10:30:00Z",
  "updated_at": "2026-03-29T10:30:00Z"
}
```

---

## 3️⃣ Endpoints a Actualizar

### ✅ GET `/api/v1/news` (Listar noticias)
**Cambios requeridos:**
- Retornar campo `image_thumbnail_url` en cada noticia
- Incluir `likes_count` y `comments_count`

```javascript
// Ejemplo de SELECT
SELECT 
  n.id, n.titulo, n.descripcion, n.resumen,
  n.image_url, n.image_thumbnail_url,  // <-- AGREGAR
  n.original_url, n.is_oficial,
  u.nombre as autor,
  COUNT(DISTINCT l.id) as likes_count,   // <-- AGREGAR
  COUNT(DISTINCT c.id) as comments_count, // <-- AGREGAR
  n.created_at, n.updated_at
FROM news n
LEFT JOIN users u ON n.created_by = u.id
LEFT JOIN likes l ON n.id = l.news_id
LEFT JOIN comments c ON n.id = c.news_id
GROUP BY n.id
ORDER BY n.published_at DESC
LIMIT ? OFFSET ?
```

### ✅ GET `/api/v1/news/:id` (Obtener noticia específica)
**Cambios requeridos:**
- Retornar `image_thumbnail_url`
- Incluir `likes_count` y `comments_count`

```javascript
// Mismo SELECT que arriba, pero filtrando por ID
WHERE n.id = ?
```

### ✅ POST `/api/v1/news` (Crear noticia)
**Cambios requeridos:**
- Aceptar parámetro `image_thumbnail_url` en el request body
- Guardar en BD
- Retornar la noticia con todos los campos

```javascript
const { titulo, descripcion, resumen, image_url, image_thumbnail_url, original_url, is_oficial } = req.body;

INSERT INTO news 
  (titulo, descripcion, resumen, image_url, image_thumbnail_url, original_url, is_oficial, created_by)
VALUES 
  (?, ?, ?, ?, ?, ?, ?, ?)
```

### ✅ PUT `/api/v1/news/:id` (Actualizar noticia)
**Cambios requeridos:**
- Aceptar `image_thumbnail_url` como parámetro actualizable
- Retornar noticia completa actualizada

```javascript
UPDATE news 
SET image_thumbnail_url = COALESCE(?, image_thumbnail_url),
    image_url = COALESCE(?, image_url),
    [ otros campos... ]
WHERE id = ?
```

---

## 4️⃣ Formato de Respuesta Paginada

El endpoint `GET /api/v1/news` debe devolver:

```json
{
  "data": [
    {
      "id": 1,
      "titulo": "...",
      "image_url": "https://...",
      "image_thumbnail_url": "https://...",
      "likes_count": 42,
      "comments_count": 5,
      ...
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 10,
    "totalPages": 15
  }
}
```

---

## 5️⃣ Optimizaciones Recomendadas



**Tamaños recomendados:**
- Miniatura: 300-400px de ancho, 200-250px alto (~20-50KB)
- Imagen completa: Mantener resolución original (sin límite)

---

## 6️⃣ Testing

### Verificar que los endpoints retornan los campos correctos:

```bash
# Listar noticias
curl "http://localhost:3001/api/v1/news?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Ver respuesta y verificar que incluye:
# - image_thumbnail_url
# - likes_count  
# - comments_count
```

---

## 7️⃣ Cambios en BD (si aplica)

Si la tabla `news` no tiene estas columnas, crearlas:

```sql
-- Revisar estructura actual
DESCRIBE news;

-- Agregar columnas faltantes si es necesario
ALTER TABLE news ADD COLUMN IF NOT EXISTS likes_count INT DEFAULT 0;
ALTER TABLE news ADD COLUMN IF NOT EXISTS comments_count INT DEFAULT 0;

-- O mejor, usar JOINs en las queries (recomendado) 
-- para evitar datos desnormalizados
```

---

## 📝 Resumen de Cambios Mínimos

| Acción | Detalle |
|--------|---------|
| **1. BD** | `ALTER TABLE news ADD COLUMN image_thumbnail_url` |
| **2. GET /news** | Agregar `image_thumbnail_url`, `likes_count`, `comments_count` al SELECT |
| **3. GET /news/:id** | Mismo cambio que arriba |
| **4. POST /news** | Aceptar `image_thumbnail_url` en parámetros |
| **5. PUT /news/:id** | Permitir actualizar `image_thumbnail_url` |

---

## 🔗 Contexto Frontend

El frontend ahora:
- ✅ Muestra `image_thumbnail_url` en el listado de noticias
- ✅ Abre un modal con `image_url` al hacer click
- ✅ Si no existe miniatura, usa `image_url` como fallback
- ✅ Soporta ambos campos en la API

**Archivo actualizado en frontend:** `src/components/news/NewsItem.vue`

---

## ❓ Preguntas Frecuentes

**P: ¿Qué pasa si no enviamos `image_thumbnail_url`?**
R: El frontend usará automáticamente `image_url` como fallback. No hay error, solo que no habrá optimización.

**P: ¿Debo cambiar la estructura de respuesta?**
R: Solo agrega los campos, no cambies el resto. La estructura debe ser compatible hacia atrás.

**P: ¿Es obligatorio generar miniaturas automáticamente?**
R: No. El desarrollador frontend puede cargar ambas imágenes manualmente si prefiere.

