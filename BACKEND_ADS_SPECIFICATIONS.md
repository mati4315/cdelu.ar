# 🔍 Especificaciones Backend - API de Anuncios

## 📋 Problema Actual
El frontend está enviando un error 400 (Bad Request) al intentar crear anuncios de lotería. Necesitamos verificar qué campos espera exactamente el backend.

## 🔧 Datos que está enviando el Frontend

```json
{
  "titulo": "🎰 Lotería Especial",
  "descripcion": "Anuncio dinámico de lotería que se actualiza automáticamente con loterías activas",
  "enlace_destino": "/lotteries",
  "texto_opcional": "Anuncio especial con prioridad 3 - Solo se muestra si hay loterías activas",
  "categoria": "eventos",
  "prioridad": 3,
  "activo": true,
  "impresiones_maximas": 0
}
```

## 🗄️ Estructura de Base de Datos Esperada

### Tabla `ads`
```sql
CREATE TABLE ads (
  id INT PRIMARY KEY AUTO_INCREMENT,
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT,
  image_url VARCHAR(500),
  enlace_destino VARCHAR(500) NOT NULL,
  texto_opcional VARCHAR(255),
  categoria VARCHAR(100) NOT NULL,
  prioridad INT NOT NULL DEFAULT 1,
  activo BOOLEAN NOT NULL DEFAULT true,
  impresiones_maximas INT NOT NULL DEFAULT 0,
  impresiones_actuales INT NOT NULL DEFAULT 0,
  clics_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## 🔍 Endpoints que debe tener el Backend

### 1. GET /api/v1/ads
**Descripción**: Obtener todos los anuncios
**Autenticación**: Requerida (Bearer Token)
**Respuesta**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "titulo": "Anuncio de Prueba",
      "descripcion": "Descripción del anuncio",
      "image_url": "https://example.com/image.jpg",
      "enlace_destino": "https://example.com",
      "texto_opcional": "Texto adicional",
      "categoria": "general",
      "prioridad": 1,
      "activo": true,
      "impresiones_maximas": 1000,
      "impresiones_actuales": 50,
      "clics_count": 10,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

### 2. POST /api/v1/ads
**Descripción**: Crear nuevo anuncio
**Autenticación**: Requerida (Bearer Token)
**Campos requeridos**:
- `titulo` (string)
- `descripcion` (string)
- `enlace_destino` (string)
- `categoria` (string)
- `prioridad` (number)
- `activo` (boolean)
- `impresiones_maximas` (number)

**Campos opcionales**:
- `image_url` (string)
- `texto_opcional` (string)

**Ejemplo de petición**:
```json
{
  "titulo": "🎰 Lotería Especial",
  "descripcion": "Anuncio dinámico de lotería",
  "enlace_destino": "/lotteries",
  "texto_opcional": "Anuncio especial",
  "categoria": "eventos",
  "prioridad": 3,
  "activo": true,
  "impresiones_maximas": 0
}
```

**Respuesta exitosa**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "titulo": "🎰 Lotería Especial",
    "descripcion": "Anuncio dinámico de lotería",
    "enlace_destino": "/lotteries",
    "texto_opcional": "Anuncio especial",
    "categoria": "eventos",
    "prioridad": 3,
    "activo": true,
    "impresiones_maximas": 0,
    "impresiones_actuales": 0,
    "clics_count": 0,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

### 3. GET /api/v1/ads/active
**Descripción**: Obtener anuncios activos (público)
**Autenticación**: No requerida
**Respuesta**:
```json
{
  "data": [
    {
      "id": 1,
      "titulo": "Anuncio Activo",
      "descripcion": "Descripción",
      "enlace_destino": "https://example.com",
      "categoria": "general",
      "prioridad": 1,
      "activo": true
    }
  ],
  "total": 1
}
```

### 4. GET /api/v1/ads/stats
**Descripción**: Obtener estadísticas de anuncios
**Autenticación**: Requerida (Bearer Token)
**Respuesta**:
```json
{
  "data": {
    "total": 10,
    "activos": 8,
    "inactivos": 2,
    "total_impresiones": 5000,
    "total_clics": 250,
    "ctr_promedio": 5.0,
    "por_categoria": {
      "general": 5,
      "eventos": 3,
      "gaming": 2
    }
  }
}
```

## 🚨 Posibles Problemas del Backend

### 1. Validación de Campos
El backend puede estar validando campos que no estamos enviando o con tipos incorrectos.

### 2. Estructura de Base de Datos
La tabla `ads` puede no tener todos los campos necesarios.

### 3. Middleware de Validación
Puede haber middleware que valida los datos antes de procesarlos.

### 4. CORS
Problemas de CORS que impiden las peticiones.

## 🔧 Soluciones para el Backend

### 1. Verificar Estructura de BD
```sql
-- Verificar si la tabla ads existe
SHOW TABLES LIKE 'ads';

-- Verificar estructura de la tabla
DESCRIBE ads;

-- Si falta algún campo, agregarlo
ALTER TABLE ads ADD COLUMN texto_opcional VARCHAR(255) AFTER enlace_destino;
```

### 2. Verificar Validaciones
El backend debe aceptar estos campos:
- `titulo` (string, requerido)
- `descripcion` (string, requerido)
- `enlace_destino` (string, requerido)
- `texto_opcional` (string, opcional)
- `categoria` (string, requerido)
- `prioridad` (number, requerido)
- `activo` (boolean, requerido)
- `impresiones_maximas` (number, requerido)

### 3. Configurar CORS
```javascript
// En el backend (Express.js)
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
```

### 4. Middleware de Validación
```javascript
// Ejemplo de middleware de validación
const validateAd = (req, res, next) => {
  const { titulo, descripcion, enlace_destino, categoria, prioridad, activo, impresiones_maximas } = req.body;
  
  if (!titulo || !descripcion || !enlace_destino || !categoria || prioridad === undefined || activo === undefined || impresiones_maximas === undefined) {
    return res.status(400).json({
      success: false,
      message: 'Campos requeridos faltantes'
    });
  }
  
  next();
};
```

## 🧪 Script de Prueba

Para debuggear el problema, ejecuta este script en la consola del navegador:

```javascript
// Cargar el script de debug
fetch('./debug-backend-ads.js')
  .then(response => response.text())
  .then(script => {
    eval(script);
    debugBackendAds();
  });
```

## 📞 Información para el Desarrollador Backend

1. **Verificar que el endpoint POST /api/v1/ads existe**
2. **Verificar que acepta los campos que estamos enviando**
3. **Verificar que la tabla `ads` tiene todos los campos necesarios**
4. **Verificar que no hay validaciones adicionales que rechacen nuestros datos**
5. **Verificar que el CORS está configurado correctamente**

## 🎯 Campos Críticos

Los campos que **DEBE** aceptar el backend:
- ✅ `titulo` (string)
- ✅ `descripcion` (string)
- ✅ `enlace_destino` (string)
- ✅ `categoria` (string)
- ✅ `prioridad` (number)
- ✅ `activo` (boolean)
- ✅ `impresiones_maximas` (number)
- ✅ `texto_opcional` (string, opcional)

Si alguno de estos campos no está en la base de datos o no se está validando correctamente, causará el error 400. 