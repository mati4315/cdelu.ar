# 🚀 Guía de Migración Frontend: De News API a Content Feed

## 📋 Resumen de Cambios

Tu aplicación Vue.js actualmente usa las APIs de noticias individuales. Ahora tenemos un **sistema de feed unificado** que combina noticias y contenido de comunidad en una sola API optimizada con tres pestañas:

- 🗞️ **"Todo"**: Noticias + Comunidad mezcladas
- 📰 **"Noticias"**: Solo noticias (equivale a tu API actual)
- 👥 **"Comunidad"**: Solo contenido de comunidad

## 🆚 Comparación de APIs

### ❌ ANTES (APIs separadas)
```typescript
// Múltiples llamadas
GET /api/v1/news           // Solo noticias
GET /api/v1/com            // Solo comunicaciones
// Sin unificación, sin pestañas
```

### ✅ AHORA (Feed unificado)
```typescript
// Una sola API con múltiples endpoints
GET /api/v1/feed           // Todo mezclado
GET /api/v1/feed/noticias  // Solo noticias (reemplaza /news)
GET /api/v1/feed/comunidad // Solo comunidad (reemplaza /com)
```

## 📊 Estructura de Datos Actualizada

### Nuevo Formato de Respuesta
```typescript
interface FeedResponse {
  data: FeedItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface FeedItem {
  id: number;                    // ID en la tabla content_feed
  titulo: string;
  descripcion: string;
  resumen?: string;              // Solo para noticias
  image_url?: string;
  type: 1 | 2;                  // 1=noticia, 2=comunidad
  original_id: number;          // ID en la tabla original (news/com)
  user_id?: number;
  user_name?: string;           // Nombre del autor/usuario
  published_at?: string;        // ISO datetime
  created_at: string;
  updated_at: string;
  
  // Campos específicos de noticias (type=1)
  original_url?: string;        // URL de la fuente
  is_oficial?: boolean;         // true=oficial, false=usuario
  
  // Campos específicos de comunidad (type=2)
  video_url?: string;           // URL del video
  
  // Estadísticas
  likes_count: number;
  comments_count: number;
}
```

## 🔄 Plan de Migración por Etapas

### Etapa 1: Preparar los Services
Actualiza tus servicios para usar las nuevas APIs manteniendo compatibilidad.

```typescript
// src/services/feedService.ts
import axios from 'axios';

export interface FeedParams {
  page?: number;
  limit?: number;
  sort?: 'titulo' | 'published_at' | 'created_at' | 'likes_count' | 'comments_count';
  order?: 'asc' | 'desc';
}

class FeedService {
  private baseURL = 'http://localhost:3001/api/v1';

  // NUEVO: Feed unificado (pestaña "Todo")
  async getFeed(params: FeedParams = {}) {
    const response = await axios.get(`${this.baseURL}/feed`, { params });
    return response.data;
  }

  // NUEVO: Solo noticias (equivale a tu API actual de news)
  async getNews(params: FeedParams = {}) {
    const response = await axios.get(`${this.baseURL}/feed/noticias`, { params });
    return response.data;
  }

  // NUEVO: Solo comunidad
  async getCommunity(params: FeedParams = {}) {
    const response = await axios.get(`${this.baseURL}/feed/comunidad`, { params });
    return response.data;
  }

  // NUEVO: Estadísticas del feed
  async getFeedStats() {
    const response = await axios.get(`${this.baseURL}/feed/stats`);
    return response.data;
  }

  // NUEVO: Elemento específico
  async getFeedItem(type: 1 | 2, id: number) {
    const response = await axios.get(`${this.baseURL}/feed/${type}/${id}`);
    return response.data;
  }

  // LEGACY: Mantener temporalmente para compatibilidad
  async getNewsLegacy(params: any = {}) {
    console.warn('getNewsLegacy está deprecado, usa getNews()');
    return this.getNews(params);
  }
}

export const feedService = new FeedService();
```

### Etapa 2: Actualizar el Store (Pinia)
Migra tu store de noticias para usar el nuevo sistema.

```typescript
// src/store/feedStore.ts
import { defineStore } from 'pinia';
import { feedService, type FeedParams } from '@/services/feedService';

export interface FeedState {
  // Contenido de cada pestaña
  allContent: FeedItem[];
  newsContent: FeedItem[];
  communityContent: FeedItem[];
  
  // UI State
  currentTab: 'todo' | 'noticias' | 'comunidad';
  isLoading: boolean;
  isInfiniteLoading: boolean;
  
  // Paginación
  pagination: {
    todo: { page: number; hasMore: boolean; total: number };
    noticias: { page: number; hasMore: boolean; total: number };
    comunidad: { page: number; hasMore: boolean; total: number };
  };
  
  // Estadísticas
  stats: {
    total: number;
    by_type: {
      news: { count: number; likes: number; comments: number };
      community: { count: number; likes: number; comments: number };
    };
  } | null;
  
  // Error handling
  error: string | null;
}

export const useFeedStore = defineStore('feed', {
  state: (): FeedState => ({
    allContent: [],
    newsContent: [],
    communityContent: [],
    currentTab: 'todo',
    isLoading: false,
    isInfiniteLoading: false,
    pagination: {
      todo: { page: 1, hasMore: true, total: 0 },
      noticias: { page: 1, hasMore: true, total: 0 },
      comunidad: { page: 1, hasMore: true, total: 0 }
    },
    stats: null,
    error: null
  }),

  getters: {
    currentContent: (state) => {
      switch (state.currentTab) {
        case 'todo': return state.allContent;
        case 'noticias': return state.newsContent;
        case 'comunidad': return state.communityContent;
        default: return state.allContent;
      }
    },
    
    currentPagination: (state) => {
      return state.pagination[state.currentTab];
    }
  },

  actions: {
    // Cargar contenido inicial
    async loadFeed(tab: 'todo' | 'noticias' | 'comunidad' = 'todo', refresh = false) {
      if (refresh) {
        this.resetPagination(tab);
        this.clearContent(tab);
      }

      this.isLoading = true;
      this.error = null;

      try {
        const params: FeedParams = {
          page: this.pagination[tab].page,
          limit: 10,
          sort: 'published_at',
          order: 'desc'
        };

        let response;
        switch (tab) {
          case 'todo':
            response = await feedService.getFeed(params);
            break;
          case 'noticias':
            response = await feedService.getNews(params);
            break;
          case 'comunidad':
            response = await feedService.getCommunity(params);
            break;
        }

        // Actualizar contenido
        if (refresh) {
          this.setContent(tab, response.data);
        } else {
          this.appendContent(tab, response.data);
        }

        // Actualizar paginación
        this.updatePagination(tab, response.pagination);

      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error al cargar el feed';
        console.error('Error loading feed:', error);
      } finally {
        this.isLoading = false;
      }
    },

    // Infinite scroll
    async loadMore() {
      const currentPag = this.currentPagination;
      if (!currentPag.hasMore || this.isInfiniteLoading) return;

      this.isInfiniteLoading = true;
      this.pagination[this.currentTab].page++;
      
      try {
        await this.loadFeed(this.currentTab, false);
      } finally {
        this.isInfiniteLoading = false;
      }
    },

    // Cambiar pestaña
    async switchTab(tab: 'todo' | 'noticias' | 'comunidad') {
      this.currentTab = tab;
      
      // Si no hay contenido, cargar
      if (this.currentContent.length === 0) {
        await this.loadFeed(tab, true);
      }
    },

    // Cargar estadísticas
    async loadStats() {
      try {
        this.stats = await feedService.getFeedStats();
      } catch (error) {
        console.error('Error loading stats:', error);
      }
    },

    // Helpers
    setContent(tab: string, content: FeedItem[]) {
      switch (tab) {
        case 'todo': this.allContent = content; break;
        case 'noticias': this.newsContent = content; break;
        case 'comunidad': this.communityContent = content; break;
      }
    },

    appendContent(tab: string, content: FeedItem[]) {
      switch (tab) {
        case 'todo': this.allContent.push(...content); break;
        case 'noticias': this.newsContent.push(...content); break;
        case 'comunidad': this.communityContent.push(...content); break;
      }
    },

    updatePagination(tab: string, pagination: any) {
      this.pagination[tab] = {
        page: pagination.page,
        hasMore: pagination.page < pagination.totalPages,
        total: pagination.total
      };
    },

    resetPagination(tab: string) {
      this.pagination[tab] = { page: 1, hasMore: true, total: 0 };
    },

    clearContent(tab: string) {
      this.setContent(tab, []);
    }
  }
});
```

### Etapa 3: Componente Principal del Feed
Crea o actualiza tu componente principal para manejar las pestañas.

```vue
<!-- src/components/feed/FeedMain.vue -->
<template>
  <div class="feed-container">
    <!-- Header con estadísticas -->
    <FeedHeader v-if="stats" :stats="stats" />
    
    <!-- Pestañas -->
    <FeedTabs 
      :current-tab="currentTab"
      :stats="stats"
      @tab-change="handleTabChange"
    />
    
    <!-- Contenido del feed -->
    <div class="feed-content">
      <!-- Loading inicial -->
      <FeedSkeleton v-if="isLoading && currentContent.length === 0" />
      
      <!-- Error -->
      <FeedError v-else-if="error" :error="error" @retry="handleRetry" />
      
      <!-- Lista de items -->
      <FeedList 
        v-else
        :items="currentContent"
        :is-loading="isInfiniteLoading"
        @load-more="handleLoadMore"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useFeedStore } from '@/store/feedStore';
import FeedHeader from './FeedHeader.vue';
import FeedTabs from './FeedTabs.vue';
import FeedList from './FeedList.vue';
import FeedSkeleton from './FeedSkeleton.vue';
import FeedError from './FeedError.vue';

const feedStore = useFeedStore();

const { 
  currentTab, 
  currentContent, 
  isLoading, 
  isInfiniteLoading, 
  stats, 
  error 
} = storeToRefs(feedStore);

// Handlers
const handleTabChange = async (tab: 'todo' | 'noticias' | 'comunidad') => {
  await feedStore.switchTab(tab);
};

const handleLoadMore = async () => {
  await feedStore.loadMore();
};

const handleRetry = async () => {
  await feedStore.loadFeed(currentTab.value, true);
};

// Inicialización
onMounted(async () => {
  await Promise.all([
    feedStore.loadFeed('todo', true),
    feedStore.loadStats()
  ]);
});
</script>
```

### Etapa 4: Componente de Pestañas
```vue
<!-- src/components/feed/FeedTabs.vue -->
<template>
  <div class="feed-tabs">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      :class="['tab', { active: currentTab === tab.key }]"
      @click="$emit('tab-change', tab.key)"
    >
      <span class="tab-icon">{{ tab.icon }}</span>
      <span class="tab-label">{{ tab.label }}</span>
      <span v-if="getTabCount(tab.key)" class="tab-count">
        {{ getTabCount(tab.key) }}
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
interface Props {
  currentTab: 'todo' | 'noticias' | 'comunidad';
  stats?: {
    total: number;
    by_type: {
      news: { count: number };
      community: { count: number };
    };
  } | null;
}

const props = defineProps<Props>();
defineEmits<{
  'tab-change': [tab: 'todo' | 'noticias' | 'comunidad'];
}>();

const tabs = [
  { key: 'todo', label: 'Todo', icon: '🗞️' },
  { key: 'noticias', label: 'Noticias', icon: '📰' },
  { key: 'comunidad', label: 'Comunidad', icon: '👥' }
] as const;

const getTabCount = (tab: string) => {
  if (!props.stats) return null;
  
  switch (tab) {
    case 'todo': return props.stats.total;
    case 'noticias': return props.stats.by_type.news.count;
    case 'comunidad': return props.stats.by_type.community.count;
    default: return null;
  }
};
</script>

<style scoped>
.feed-tabs {
  display: flex;
  background: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
  border-radius: 8px 8px 0 0;
}

.tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px 20px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  color: #6c757d;
  transition: all 0.3s ease;
}

.tab:hover {
  background: #e9ecef;
  color: #495057;
}

.tab.active {
  background: #007bff;
  color: white;
}

.tab-count {
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.tab.active .tab-count {
  background: rgba(255, 255, 255, 0.3);
}
</style>
```

### Etapa 5: Componente de Item del Feed
```vue
<!-- src/components/feed/FeedItem.vue -->
<template>
  <article class="feed-item" :class="itemTypeClass">
    <!-- Header del item -->
    <header class="feed-item-header">
      <div class="item-meta">
        <span class="item-type">{{ typeLabel }}</span>
        <span class="item-author">{{ item.user_name || 'Sin autor' }}</span>
        <time class="item-date" :datetime="item.published_at">
          {{ formatDate(item.published_at) }}
        </time>
      </div>
      
      <!-- Badge oficial para noticias -->
      <span v-if="item.is_oficial === true" class="official-badge">
        🏛️ Oficial
      </span>
    </header>

    <!-- Contenido -->
    <div class="feed-item-content">
      <h3 class="item-title">{{ item.titulo }}</h3>
      <p class="item-description">{{ truncatedDescription }}</p>
      
      <!-- Imagen -->
      <img 
        v-if="item.image_url" 
        :src="item.image_url" 
        :alt="item.titulo"
        class="item-image"
        loading="lazy"
      />
      
      <!-- Indicador de video -->
      <div v-if="item.video_url" class="video-indicator">
        🎬 Incluye video
      </div>
      
      <!-- Link a fuente original -->
      <a 
        v-if="item.original_url" 
        :href="item.original_url" 
        target="_blank"
        rel="noopener noreferrer"
        class="source-link"
      >
        🔗 Ver fuente original
      </a>
    </div>

    <!-- Footer con estadísticas -->
    <footer class="feed-item-footer">
      <div class="item-stats">
        <span class="stat">❤️ {{ item.likes_count }}</span>
        <span class="stat">💬 {{ item.comments_count }}</span>
      </div>
      
      <!-- Acciones -->
      <div class="item-actions">
        <button @click="viewDetails" class="action-btn">
          Ver detalles
        </button>
        <button @click="toggleLike" class="action-btn like-btn">
          {{ isLiked ? '❤️' : '🤍' }}
        </button>
      </div>
    </footer>
  </article>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { FeedItem } from '@/types/feed';

interface Props {
  item: FeedItem;
}

const props = defineProps<Props>();

const isLiked = ref(false); // TODO: Implementar lógica de likes

const typeLabel = computed(() => {
  return props.item.type === 1 ? 'Noticia' : 'Comunidad';
});

const itemTypeClass = computed(() => {
  return props.item.type === 1 ? 'feed-item--news' : 'feed-item--community';
});

const truncatedDescription = computed(() => {
  const maxLength = 200;
  if (props.item.descripcion.length <= maxLength) {
    return props.item.descripcion;
  }
  return props.item.descripcion.substring(0, maxLength) + '...';
});

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'Sin fecha';
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const viewDetails = () => {
  // TODO: Implementar navegación a detalle
  console.log('Ver detalles:', props.item);
};

const toggleLike = () => {
  // TODO: Implementar toggle de like
  isLiked.value = !isLiked.value;
};
</script>

<style scoped>
.feed-item {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  transition: all 0.3s ease;
}

.feed-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.feed-item--news {
  border-left: 4px solid #007bff;
}

.feed-item--community {
  border-left: 4px solid #28a745;
}

.feed-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: #6c757d;
}

.item-type {
  background: #007bff;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.feed-item--community .item-type {
  background: #28a745;
}

.official-badge {
  background: #ffc107;
  color: #212529;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.item-title {
  margin: 0 0 12px 0;
  font-size: 20px;
  font-weight: 600;
  color: #212529;
  line-height: 1.3;
}

.item-description {
  margin: 0 0 16px 0;
  color: #495057;
  line-height: 1.5;
}

.item-image {
  width: 100%;
  max-height: 300px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 12px;
}

.video-indicator {
  background: #dc3545;
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 14px;
  display: inline-block;
  margin-bottom: 12px;
}

.source-link {
  color: #007bff;
  text-decoration: none;
  font-size: 14px;
  display: inline-block;
  margin-bottom: 12px;
}

.source-link:hover {
  text-decoration: underline;
}

.feed-item-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #e9ecef;
}

.item-stats {
  display: flex;
  gap: 16px;
}

.stat {
  font-size: 14px;
  color: #6c757d;
}

.item-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 6px 12px;
  border: 1px solid #dee2e6;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: #f8f9fa;
}

.like-btn:hover {
  background: #fff5f5;
  border-color: #dc3545;
}
</style>
```

## 🔄 Migración Gradual

### Opción 1: Migración Completa Inmediata
```typescript
// 1. Reemplaza tu servicio actual
import { feedService } from '@/services/feedService';

// 2. Cambia tus llamadas
// ANTES: newsService.getNews()
// DESPUÉS: feedService.getNews()

// 3. Actualiza tus componentes para usar FeedMain
```

### Opción 2: Migración Gradual con Feature Flag
```typescript
// src/config/features.ts
export const FEATURES = {
  USE_UNIFIED_FEED: true, // Cambiar a true para activar
};

// En tu componente
import { FEATURES } from '@/config/features';

const useUnifiedFeed = computed(() => FEATURES.USE_UNIFIED_FEED);
```

## 🧪 Testing y Verificación

### 1. Verificar APIs
```bash
# Probar que las APIs responden
curl http://localhost:3001/api/v1/feed/noticias
curl http://localhost:3001/api/v1/feed/stats
```

### 2. Test de Compatibilidad
```typescript
// Verificar que los datos son compatibles
const testDataCompatibility = async () => {
  const oldNews = await oldNewsService.getNews();
  const newNews = await feedService.getNews();
  
  // Verificar estructura
  console.log('Old structure:', oldNews.data[0]);
  console.log('New structure:', newNews.data[0]);
  
  // Verificar campos importantes
  const oldFields = Object.keys(oldNews.data[0] || {});
  const newFields = Object.keys(newNews.data[0] || {});
  
  console.log('Missing fields:', oldFields.filter(f => !newFields.includes(f)));
  console.log('New fields:', newFields.filter(f => !oldFields.includes(f)));
};
```

## ⚠️ Puntos Importantes

### 1. Cambios en los IDs
- **Antes**: `id` era el ID de la tabla `news`
- **Ahora**: `id` es el ID de la tabla `content_feed`, usa `original_id` para el ID original

### 2. Campo `type` Nuevo
- `type: 1` = Noticia (equivale a tu contenido anterior)
- `type: 2` = Comunidad (nuevo)

### 3. Campos Nuevos Disponibles
- `user_name`: Nombre del autor (antes tenías que hacer JOIN)
- `likes_count`, `comments_count`: Estadísticas precalculadas
- `video_url`: Para contenido de comunidad
- `original_url`: Para noticias con fuente externa

### 4. Rendimiento Mejorado
- ✅ Una sola consulta por llamada
- ✅ Datos precalculados (likes, comments)
- ✅ Índices optimizados
- ✅ Paginación eficiente

## 🚀 Beneficios de la Migración

1. **Mejor UX**: Tres pestañas en lugar de páginas separadas
2. **Mejor Performance**: Una sola API unificada
3. **Más Datos**: Estadísticas y metadatos enriquecidos
4. **Escalabilidad**: Preparado para futuras extensiones
5. **Consistencia**: Mismo formato para todo el contenido

## 📞 Soporte

Si tienes dudas durante la migración:

1. **APIs**: Usa `/api/v1/docs` para ver documentación interactiva
2. **Ejemplos**: Revisa `/examples/feed-example.html`
3. **Testing**: Todas las APIs GET son públicas, puedes probarlas directamente

¡La migración debería ser fluida manteniendo toda la funcionalidad actual y agregando las nuevas capacidades! 🎉 