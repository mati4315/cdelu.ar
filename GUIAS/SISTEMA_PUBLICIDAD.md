# 📢 Sistema de Publicidad - CdelU

## 🎯 **Descripción General**

El sistema de publicidad de CdelU permite integrar anuncios publicitarios en el feed unificado de manera inteligente y no intrusiva. Los anuncios se mezclan automáticamente con el contenido existente (noticias y comunidad) siguiendo algoritmos de frecuencia controlada.

## 🏗️ **Arquitectura del Sistema**

### **Tabla de Base de Datos: `ads`**

```sql
CREATE TABLE ads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT,
  image_url VARCHAR(500),
  enlace_destino VARCHAR(500) NOT NULL,
  texto_opcional VARCHAR(255),
  categoria VARCHAR(100) DEFAULT 'general',
  prioridad INT DEFAULT 1,
  activo BOOLEAN DEFAULT TRUE,
  impresiones_maximas INT DEFAULT 0,
  impresiones_actuales INT DEFAULT 0,
  clics_count INT DEFAULT 0,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### **Triggers de Sincronización**

- **`after_ads_insert`**: Inserta automáticamente en `content_feed` cuando se crea un anuncio
- **`after_ads_update`**: Actualiza `content_feed` cuando se modifica un anuncio
- **`after_ads_delete`**: Elimina de `content_feed` cuando se borra un anuncio

## 🚀 **Endpoints de la API**

### **📊 Endpoints Públicos**

#### **GET `/api/v1/ads/active`**
Obtiene anuncios activos para el feed.

**Parámetros:**
- `limit` (opcional): Número máximo de anuncios (default: 20)
- `categoria` (opcional): Filtrar por categoría

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "titulo": "Patrocinado por Trigamer",
      "descripcion": "Descubre los mejores juegos",
      "image_url": "https://...",
      "enlace_destino": "https://trigamer.xyz",
      "texto_opcional": "¡Juega y gana!",
      "categoria": "gaming",
      "prioridad": 1,
      "activo": true,
      "impresiones_actuales": 0,
      "clics_count": 0
    }
  ],
  "total": 3
}
```

#### **POST `/api/v1/ads/:id/impression`**
Registra una impresión de anuncio.

#### **POST `/api/v1/ads/:id/click`**
Registra un clic en un anuncio.

### **🔧 Endpoints de Administración**

#### **GET `/api/v1/ads`**
Obtiene todos los anuncios con paginación (solo administradores).

#### **GET `/api/v1/ads/:id`**
Obtiene un anuncio específico por ID.

#### **POST `/api/v1/ads`**
Crea un nuevo anuncio.

**Body:**
```json
{
  "titulo": "Nuevo Anuncio",
  "descripcion": "Descripción del anuncio",
  "image_url": "https://...",
  "enlace_destino": "https://destino.com",
  "texto_opcional": "Texto adicional",
  "categoria": "tecnologia",
  "prioridad": 1,
  "activo": true,
  "impresiones_maximas": 1000
}
```

#### **PUT `/api/v1/ads/:id`**
Actualiza un anuncio existente.

#### **DELETE `/api/v1/ads/:id`**
Elimina un anuncio.

#### **GET `/api/v1/ads/stats`**
Obtiene estadísticas de publicidad.

## 🔄 **Integración con el Feed**

### **Feed con Publicidad**

Para obtener el feed con publicidad mezclada:

```
GET /api/v1/feed?includeAds=true
```

### **Algoritmo de Mezcla**

1. **Frecuencia**: Anuncios aparecen cada 4-7 posts
2. **Aleatorización**: Posición exacta dentro del rango es aleatoria
3. **Rotación**: Los anuncios se rotan para evitar repetición
4. **Límites**: Máximo 10 anuncios por página

### **Estructura de Respuesta**

```json
{
  "data": [
    {
      "id": 1,
      "titulo": "Noticia oficial",
      "type": 1,
      "is_ad": false
    },
    {
      "id": 2,
      "titulo": "Anuncio patrocinado",
      "type": 3,
      "is_ad": true,
      "enlace_destino": "https://...",
      "texto_opcional": "¡Patrocinado!"
    }
  ]
}
```

## 📈 **Sistema de Métricas**

### **Métricas por Anuncio**
- **Impresiones**: Número de veces que se mostró
- **Clics**: Número de veces que se hizo clic
- **CTR**: Click-Through Rate (clics/impresiones)

### **Métricas Generales**
- Total de anuncios activos/inactivos
- Impresiones totales
- Clics totales
- CTR promedio

## 🎨 **Características del Sistema**

### **✅ Funcionalidades Implementadas**

1. **Gestión Completa de Anuncios**
   - Crear, editar, eliminar anuncios
   - Control de estado activo/inactivo
   - Categorización y priorización

2. **Integración Automática**
   - Triggers de sincronización con `content_feed`
   - Mezcla inteligente en el feed
   - Compatibilidad total con el sistema existente

3. **Tracking y Métricas**
   - Registro automático de impresiones
   - Registro de clics
   - Estadísticas en tiempo real

4. **Control de Frecuencia**
   - Algoritmo de mezcla 4-7 posts
   - Rotación de anuncios
   - Límites configurables

5. **API Completa**
   - Endpoints públicos para frontend
   - Endpoints administrativos protegidos
   - Documentación Swagger integrada

### **🔧 Configuración**

#### **Parámetros de Mezcla**
```javascript
const minPostsBetweenAds = 4;  // Mínimo posts entre anuncios
const maxPostsBetweenAds = 7;  // Máximo posts entre anuncios
const adInsertProbability = 0.3; // 30% probabilidad de inserción
```

#### **Límites de Anuncios**
- Máximo 20 anuncios por consulta
- Máximo 10 anuncios por página de feed
- Límite de impresiones por anuncio (configurable)

## 🧪 **Pruebas del Sistema**

### **Script de Pruebas**
```bash
node test-ads-system.js
```

### **Casos de Prueba**
1. ✅ Obtener anuncios activos
2. ✅ Feed con publicidad mezclada
3. ✅ Registro de impresiones
4. ✅ Registro de clics
5. ✅ Feed sin publicidad (comparación)

## 📋 **Uso en Frontend**

### **Vue.js Component Example**
```vue
<template>
  <div class="feed-container">
    <div v-for="item in feedItems" :key="item.id" class="feed-item">
      <!-- Contenido normal -->
      <div v-if="!item.is_ad" class="content-item">
        <h3>{{ item.titulo }}</h3>
        <p>{{ item.descripcion }}</p>
      </div>
      
      <!-- Anuncio -->
      <div v-else class="ad-item" @click="handleAdClick(item)">
        <div class="ad-badge">Patrocinado</div>
        <h3>{{ item.titulo }}</h3>
        <p>{{ item.descripcion }}</p>
        <a :href="item.enlace_destino" target="_blank">
          {{ item.texto_opcional }}
        </a>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      feedItems: []
    }
  },
  async mounted() {
    // Obtener feed con publicidad
    const response = await fetch('/api/v1/feed?includeAds=true');
    this.feedItems = response.data;
  },
  methods: {
    async handleAdClick(ad) {
      // Registrar clic
      await fetch(`/api/v1/ads/${ad.id}/click`, { method: 'POST' });
      // Abrir enlace
      window.open(ad.enlace_destino, '_blank');
    }
  }
}
</script>
```

## 🚀 **Próximas Mejoras**

### **Funcionalidades Planificadas**
1. **Segmentación por Usuario**
   - Anuncios personalizados según perfil
   - Historial de interacciones

2. **Optimización de Rendimiento**
   - Cache de anuncios activos
   - Compresión de imágenes

3. **Analytics Avanzado**
   - Dashboard de métricas
   - Reportes automáticos
   - A/B testing

4. **Monetización**
   - Sistema de pujas
   - Tarifas por impresión/clic
   - Facturación automática

## 📚 **Referencias**

- [Documentación de la API](./api-docs.md)
- [Guía de Integración Frontend](./frontend-integration.md)
- [Scripts de Migración](./migration-scripts.md)
- [Ejemplos de Uso](./examples/)

---

**🎉 El sistema de publicidad está completamente integrado y listo para usar!** 

## 🎉 **¡Sistema de Publicidad Implementado Completamente!**

He implementado exitosamente el **sistema de publicidad "pub"** siguiendo la estructura de tu web. Aquí está el resumen de lo que se ha creado:

### **📊 Estructura Implementada**

#### **1. Base de Datos**
- ✅ **Tabla `ads`** con todos los campos necesarios
- ✅ **Triggers automáticos** para sincronización con `content_feed`
- ✅ **Datos de prueba** incluidos

#### **2. Backend API**
- ✅ **Controlador `adsController.js`** con todas las operaciones CRUD
- ✅ **Rutas `ads.routes.js`** con endpoints públicos y administrativos
- ✅ **Integración con el feed** mediante parámetro `includeAds=true`
- ✅ **Algoritmo de mezcla inteligente** (4-7 posts entre anuncios)

#### **3. Funcionalidades Clave**

**🎯 Gestión de Anuncios:**
- Crear, editar, eliminar anuncios
- Control de estado activo/inactivo
- Categorización y priorización
- Límites de impresiones

**📈 Tracking y Métricas:**
- Registro automático de impresiones
- Registro de clics
- Estadísticas en tiempo real
- CTR (Click-Through Rate)

**🔄 Integración Automática:**
- Triggers que sincronizan con `content_feed`
- Mezcla inteligente en el feed
- Compatibilidad total con el sistema existente

### **🚀 Endpoints Disponibles**

#### **Públicos:**
- `GET /api/v1/ads/active` - Anuncios activos
- `POST /api/v1/ads/:id/impression` - Registrar impresión
- `POST /api/v1/ads/:id/click` - Registrar clic

#### **Administrativos:**
- `GET /api/v1/ads` - Listar todos los anuncios
- `POST /api/v1/ads` - Crear anuncio
- `PUT /api/v1/ads/:id` - Actualizar anuncio
- `DELETE /api/v1/ads/:id` - Eliminar anuncio
- `GET /api/v1/ads/stats` - Estadísticas

### **🔄 Feed con Publicidad**

Para usar el feed con publicidad:
```
GET /api/v1/feed?includeAds=true
```

**Algoritmo de mezcla:**
- Anuncios aparecen cada 4-7 posts
- Posición aleatoria dentro del rango
- Rotación automática de anuncios
- Máximo 10 anuncios por página

### **🎨 Características Destacadas**

- ✅ **No intrusivo**: Mezcla inteligente que no molesta al usuario
- ✅ **Métricas completas**: Tracking de impresiones y clics
- ✅ **Flexible**: Categorización y priorización de anuncios
- ✅ **Escalable**: Sistema preparado para crecimiento
- ✅ **Integrado**: Compatible 100% con tu arquitectura existente

**¡El sistema de publicidad está listo para monetizar tu plataforma!** 🚀💰 