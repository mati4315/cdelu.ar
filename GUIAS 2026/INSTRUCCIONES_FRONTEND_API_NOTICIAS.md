# 📢 Actualización de API de Noticias (v1.1) - Frontend

## 🎯 Resumen Ejecutivo
La API de noticias ha sido actualizada para soportar miniaturas de imágenes y metadatos adicionales. **Debes actualizar los componentes que consumen esta API**.

---

## 1️⃣ Nuevos Campos en la Respuesta

### GET `/api/v1/news` y `/api/v1/news/:id`

Cada objeto de noticia ahora incluye estos **3 campos nuevos**:

```javascript
{
  "id": 1,
  "titulo": "Nombre de la noticia",
  "descripcion": "Descripción completa...",
  "image_url": "https://ejemplo.com/imagen-completa.jpg",
  
  // ✅ NUEVOS CAMPOS
  "image_thumbnail_url": "https://ejemplo.com/imagen-miniatura.jpg",
  "diario": "La Calle",
  "categoria": "Deportes",
  
  "original_url": "https://...",
  "is_oficial": true,
  "autor": "Nombre del autor",
  "likes_count": 42,
  "comments_count": 5,
  "created_at": "2026-03-29T10:30:00Z",
  "updated_at": "2026-03-29T10:30:00Z"
}
```

### 📋 Descripción de Campos Nuevos

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `image_thumbnail_url` | string (nullable) | URL de la imagen optimizada (miniatura) | `https://ejemplo.com/thumb.jpg` |
| `diario` | string (nullable) | Nombre del medio de origen | `"La Calle"`, `"Cambio"` |
| `categoria` | string (nullable) | Categoría de la noticia | `"Deportes"`, `"Política"`, `"Economía"` |

---

## 2️⃣ Campo Eliminado

❌ **`resumen`** - Este campo **YA NO EXISTE**.

**Alternativa:** Si necesitas un extracto breve:
- Usa la `descripcion` completa y trunca en el frontend si es necesario
- Vue/React: `descripcion.substring(0, 150) + '...'`

---

## 3️⃣ Implementación Recomendada

### En el Listado de Noticias

**Usar la miniatura para mejorar rendimiento:**

```javascript
// Vue 3
<script setup>
const newsImage = computed(() => news.image_thumbnail_url || news.image_url);
</script>

<template>
  <img :src="newsImage" :alt="news.titulo" />
</template>
```

```jsx
// React
const NewsImage = ({ news }) => {
  const imageSrc = news.image_thumbnail_url || news.image_url;
  return <img src={imageSrc} alt={news.titulo} />;
};
```

### Mostrar Información del Diario y Categoría

```vue
<div class="news-item">
  <img :src="newsImage" :alt="news.titulo" class="thumbnail" />
  
  <!-- Nuevo: Mostrar diario y categoría -->
  <div class="news-meta">
    <span v-if="news.diario" class="badge-diario">{{ news.diario }}</span>
    <span v-if="news.categoria" class="badge-categoria">{{ news.categoria }}</span>
  </div>
  
  <h3>{{ news.titulo }}</h3>
  <p>{{ news.descripcion }}</p>
</div>
```

### En Modal o Vista Detallada

```javascript
// Abrir imagen completa al hacer click
const openImageModal = (news) => {
  // Usar image_url para la vista de alta resolución
  showModal(news.image_url, news.titulo);
};
```

---

## 4️⃣ Cambios en Creación/Edición (Admin Panel)

Si tienes un panel de administración, los endpoints ahora aceptan:

### POST `/api/v1/news`

```javascript
{
  "titulo": "Nueva noticia",
  "descripcion": "Descripción...",
  "image_url": "https://ejemplo.com/imagen-completa.jpg",
  "image_thumbnail_url": "https://ejemplo.com/miniatura.jpg", // ✅ NUEVO
  "diario": "La Calle",                                         // ✅ NUEVO
  "categoria": "Deportes",                                      // ✅ NUEVO
  "original_url": "https://...",
  "is_oficial": true
}
```

### PUT `/api/v1/news/:id`

Mismo formato, puedes actualizar cualquier campo.

---

## 5️⃣ Ejemplo Completo (Vue 3 + Composition API)

```vue
<script setup>
import { computed } from 'vue';

const props = defineProps({
  news: {
    type: Object,
    required: true
  }
});

// Fallback automático a imagen completa si no hay miniatura
const newsImage = computed(() => props.news.image_thumbnail_url || props.news.image_url);

// Truncar descripción si es muy larga
const shortDescription = computed(() => {
  const desc = props.news.descripcion;
  return desc.length > 150 ? desc.substring(0, 150) + '...' : desc;
});

const openFullImage = () => {
  // Abrir en modal la imagen completa
  window.open(props.news.image_url, '_blank');
};
</script>

<template>
  <article class="news-card">
    <!-- Imagen con fallback -->
    <img 
      :src="newsImage" 
      :alt="news.titulo"
      @click="openFullImage"
      class="news-thumbnail"
    />
    
    <!-- Metadatos -->
    <div class="news-metadata">
      <span v-if="news.diario" class="badge badge-diario">
        {{ news.diario }}
      </span>
      <span v-if="news.categoria" class="badge badge-categoria">
        {{ news.categoria }}
      </span>
    </div>
    
    <!-- Contenido -->
    <h2>{{ news.titulo }}</h2>
    <p class="description">{{ shortDescription }}</p>
    
    <!-- Engagement -->
    <div class="stats">
      <span v-if="news.likes_count">❤️ {{ news.likes_count }}</span>
      <span v-if="news.comments_count">💬 {{ news.comments_count }}</span>
    </div>
  </article>
</template>

<style scoped>
.news-thumbnail {
  cursor: pointer;
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 8px;
}

.badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.badge-diario {
  background-color: #e3f2fd;
  color: #1976d2;
}

.badge-categoria {
  background-color: #f3e5f5;
  color: #7b1fa2;
}
</style>
```

---

## 6️⃣ Checklist de Implementación

- [ ] Actualizar componente que lista noticias para usar `image_thumbnail_url`
- [ ] Agregar fallback a `image_url` si miniatura es null
- [ ] Eliminar referencias al campo `resumen`
- [ ] Mostrar badge del `diario` en el listado
- [ ] Mostrar badge de la `categoria` en el listado
- [ ] Probar en dev: `http://localhost:5173/` (o tu puerto)
- [ ] Verificar que la API retorna los 3 campos nuevos
- [ ] Si existe admin panel, actualizar formulario para aceptar los 3 campos nuevos

---

## 7️⃣ Debugging

### Verificar que los datos llegan correctamente:

**En el navegador (DevTools):**
```javascript
// Dentro de tu componente Vue/React
console.table(newsArray.map(n => ({
  titulo: n.titulo,
  image_thumbnail_url: n.image_thumbnail_url,
  diario: n.diario,
  categoria: n.categoria
})));
```

### Si la API aún no retorna los campos:

1. Verifica que el backend fue actualizado ✅ (ver archivo `INSTRUCCIONES_BACKEND_IMAGE_THUMBNAIL.md`)
2. Haz refresh de la página: `Ctrl + Shift + R` (hard refresh)
3. Revisa Network tab para ver la respuesta actual del endpoint

---

## ❓ Preguntas Frecuentes

**P: ¿Qué pasa si `image_thumbnail_url` está vacío?**
R: Usa `image_url` como fallback. El patrón es: `image_thumbnail_url || image_url`

**P: ¿El campo `resumen` vuelve en futuras versiones?**
R: No. Usa `descripcion` truncada si necesitas un extracto breve.

**P: ¿Los campos `diario` y `categoria` pueden ser null?**
R: Sí. Maneja con v-if/conditional rendering.

**P: ¿Debo cambiar la estructura de mi estado (Pinia/Vuex/Redux)?**
R: No es necesario si ya capturaban toda la respuesta. Los campos nuevos se agregarán automáticamente.

**P: ¿Hay un endpoint diferente para noticias destacadas?**
R: No. Los mismos endpoints retornan todos los campos. El filtrado se hace en el componente.

---

## 📞 Contacto
Si tienes dudas sobre la implementación, revisa:
- Backend: [INSTRUCCIONES_BACKEND_IMAGE_THUMBNAIL.md](./INSTRUCCIONES_BACKEND_IMAGE_THUMBNAIL.md)
- API Base: `http://localhost:3001/api/v1`
