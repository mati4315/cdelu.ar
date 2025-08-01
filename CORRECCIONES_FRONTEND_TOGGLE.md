# 🔧 Correcciones Requeridas en el Frontend

## 🚨 **Problema Actual:**

El frontend está usando el endpoint incorrecto para los likes. Los logs muestran:

```
POST http://localhost:3001/api/v1/feed/46/like 400 (Bad Request)
```

**Error:** El usuario ya dio like, y el endpoint POST `/like` no puede dar like dos veces.

## ✅ **Solución: Usar Endpoint de Toggle**

### 1️⃣ **En `feedService.ts`** - Cambiar el método `toggleLike`:

**❌ ANTES:**
```typescript
async toggleLike(feedId: number) {
  // Llamando al endpoint POST /like
  return await this.request.post(`/feed/${feedId}/like`);
}
```

**✅ DESPUÉS:**
```typescript
async toggleLike(feedId: number) {
  // Llamando al endpoint POST /like/toggle
  return await this.request.post(`/feed/${feedId}/like/toggle`);
}
```

### 2️⃣ **Verificar estructura de respuesta esperada:**

El nuevo endpoint devuelve:
```typescript
{
  liked: boolean,        // Estado actual del like
  likes_count: number,   // Contador total de likes
  message: string        // Mensaje de confirmación
}
```

### 3️⃣ **En `feedStore.ts`** - Actualizar manejo de respuesta:

**✅ Verificar que `updateItemLike` maneje correctamente:**
```typescript
// El store debe recibir y usar:
response.liked        // en lugar de calcular el estado
response.likes_count  // contador actualizado del servidor
```

## 🎯 **Endpoints Correctos Disponibles:**

### ✅ **Para Likes:**
- `POST /api/v1/feed/:feedId/like/toggle` ← **USAR ESTE**
- `POST /api/v1/feed/:feedId/like` (solo agregar)
- `DELETE /api/v1/feed/:feedId/like` (solo quitar)

### ✅ **Para Obtener Items:**
- `GET /api/v1/feed/:id` ← **NUEVO** (por feed ID)
- `GET /api/v1/feed/by-original-id/:type/:originalId` ← **NUEVO** (por original ID)
- `GET /api/v1/feed/:type/:id` (por tipo e ID)

## 🚀 **Pasos de Implementación:**

1. **Cambiar URL en `feedService.ts`:**
   ```diff
   - `/feed/${feedId}/like`
   + `/feed/${feedId}/like/toggle`
   ```

2. **Verificar que el frontend use la respuesta correcta:**
   ```typescript
   const response = await feedService.toggleLike(feedId);
   // response.liked = true/false
   // response.likes_count = número
   // response.message = string
   ```

3. **Actualizar estado en store:**
   ```typescript
   this.updateItemLike(feedId, response.likes_count, response.liked);
   ```

## 🧪 **Prueba de Funcionamiento:**

Después de hacer estos cambios:

1. El botón de like funcionará como toggle (agregar/quitar)
2. Los likes persistirán después de refrescar
3. El contador se actualizará en tiempo real
4. No más errores 400 "Ya has dado like"

## 📋 **Resultado Esperado:**

```
✅ POST /api/v1/feed/46/like/toggle 200 OK
✅ Response: { liked: true, likes_count: 1, message: "Like agregado correctamente" }
✅ POST /api/v1/feed/46/like/toggle 200 OK  
✅ Response: { liked: false, likes_count: 0, message: "Like eliminado correctamente" }
```

¡Con estos cambios el sistema de likes funcionará perfectamente! 🎉 