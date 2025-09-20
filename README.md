# 📰 CdelU - Portal de Noticias API

> **Versión 1.2.0** - API REST para el diario online CdelU con autenticación JWT, gestión multimedia, optimizaciones para hosting compartido y **soporte completo para apps móviles**.

[![GitHub repo](https://img.shields.io/badge/GitHub-mati4315%2Fcdelu.ar-blue?logo=github)](https://github.com/mati4315/cdelu.ar)
[![Node.js](https://img.shields.io/badge/Node.js-16%2B-green?logo=node.js)](https://nodejs.org/)
[![Fastify](https://img.shields.io/badge/Fastify-5.3%2B-black?logo=fastify)](https://fastify.io/)
[![MySQL](https://img.shields.io/badge/MySQL-5.7%2B-orange?logo=mysql)](https://mysql.com/)

## 🚀 Características Principales

- ✅ **API RESTful** con Fastify optimizada para hosting compartido
- 🔐 **Autenticación JWT** completa con roles de usuario
- 📱 **CORS configurado** para múltiples orígenes
- 📚 **Documentación Swagger/OpenAPI** interactiva
- 🖼️ **Upload multimedia** (imágenes y videos hasta 200MB)
- 📊 **Sistema de comunicaciones** con múltiples archivos
- 🔄 **Fallback automático** para máxima estabilidad
- 🌐 **Optimizado para cPanel** y hosting compartido
- 📈 **Diagnóstico avanzado** con endpoints de health check
- 💬 **Sistema completo** de comentarios, likes y tags

## 🛡️ Últimas Mejoras (v1.2.0)

### ✅ Nuevas Funcionalidades para Apps Móviles

- **📱 ENDPOINTS MÓVILES COMPLETOS**: Configuración, health check, feed y login optimizados para Android/iOS
- **🌐 CORS MEJORADO**: Permitir conexiones desde apps móviles con headers optimizados
- **📋 GUÍA ANDROID COMPLETA**: Documentación paso a paso para conectar apps Android
- **🧪 TESTING AUTOMATIZADO**: Script para verificar que todos los endpoints móviles funcionan

### ✅ Soluciones Críticas Implementadas (v1.1.0)

- **🔧 LOGIN COMPLETAMENTE FUNCIONAL**: Corregido error 500 agregando configuración JWT faltante
- **🚀 ERRORES WEBASSEMBLY SOLUCIONADOS**: Filtrado automático y configuración anti-WASM para cPanel
- **⚙️ OPTIMIZADO PARA HOSTING COMPARTIDO**: Límites de memoria, pool de conexiones y variables de entorno
- **🔄 FALLBACK ROBUSTO**: App mínima sin Swagger como respaldo automático

## 📋 Requisitos

- **Node.js** v16+ (recomendado v18+)
- **MySQL** 5.7+ 
- **Hosting con soporte Node.js** (Passenger recomendado)

## 🛠️ Instalación Rápida

### Para Desarrollo Local

```bash
# 1. Clonar repositorio
git clone https://github.com/mati4315/cdelu.ar.git
cd cdelu.ar

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus datos

# 4. Configurar base de datos MySQL
# Ejecutar scripts SQL de /sql/

# 5. Iniciar servidor
npm run dev
```

### Para cPanel/Hosting Compartido

```bash
# 1. Subir archivos al servidor
# 2. En cPanel terminal:
cd /home/tu_usuario/diario.tu_dominio.com
npm install
npm install undici@5.28.4 --save

# 3. Configurar .env con datos del hosting
# 4. En cPanel > Setup Node.js App:
#    - Startup File: passenger_app.js
#    - Hacer clic en "Restart"
```

## 🔧 Configuración de Variables de Entorno

```env
# === BASE DE DATOS ===
DB_HOST=localhost
DB_PORT=3306
DB_USER=tu_usuario_mysql
DB_PASSWORD=tu_password_mysql
DB_NAME=trigamer_diario

# === JWT AUTENTICACIÓN ===
JWT_SECRET=tu_clave_super_secreta_de_minimo_32_caracteres
JWT_EXPIRES_IN=24h

# === SERVIDOR ===
PORT=3001
NODE_ENV=production

# === CORS (Dominios permitidos) ===
CORS_ORIGIN=https://tu-dominio.com,https://www.tu-dominio.com

# === OPTIMIZACIÓN HOSTING COMPARTIDO ===
NODE_OPTIONS=--no-wasm --max-old-space-size=512
UNDICI_WASM=0
UNDICI_DISABLE_WASM=true
UV_THREADPOOL_SIZE=2

# === RSS (Opcional) ===
RSS_ENABLED=true
RSS_FEED_URL=https://ejemplo.com/feed
```

### 📺 Facebook Live (Opcional)

Para habilitar el widget de Facebook Live en el frontend, configura estas variables y expone tu dominio en CORS:

```env
FB_PAGE_ID=tu_page_id
FB_PAGE_TOKEN=tu_page_access_token_largo_plazo
FB_GRAPH_VERSION=v18.0
FB_CACHE_TTL_SECONDS=30
```

El backend expone `GET /api/v1/facebook/live-status` y retorna:

```json
{
  "isLive": true,
  "videoId": "1234567890",
  "embedUrl": "https://www.facebook.com/plugins/video.php?href=...",
  "hlsUrl": null,
  "title": "Título del live",
  "startedAt": "2025-08-09T12:34:56Z"
}
```

## 📚 Documentación de la API

### 🌐 Acceso a la Documentación

| Entorno | URL | Descripción |
|---------|-----|-------------|
| **Desarrollo** | `http://localhost:3001/api/v1/docs` | Swagger UI completo |
| **Producción** | `https://tu-dominio.com/api/v1/docs` | Swagger UI en vivo |
| **Dashboard** | `https://tu-dominio.com/public/dashboard.html` | Panel de administración |

### 🔍 Endpoints de Diagnóstico

```bash
# Health check básico
curl https://tu-dominio.com/health

# Estado detallado del sistema
curl https://tu-dominio.com/api/v1/status
```

## 🔗 Endpoints Principales

### 📱 Endpoints Específicos para Apps Móviles

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| `GET` | `/api/v1/mobile/config` | Configuración para apps móviles | No |
| `GET` | `/api/v1/mobile/health` | Health check optimizado para móviles | No |
| `GET` | `/api/v1/mobile/feed` | Feed optimizado para apps móviles | No |
| `POST` | `/api/v1/mobile/login` | Login optimizado para apps móviles | No |

### 🎯 Características para Apps Móviles

- **✅ CORS configurado** para permitir conexiones desde apps móviles
- **✅ Headers optimizados** para mejor rendimiento en móviles
- **✅ Endpoints específicos** con datos optimizados para consumo móvil
- **✅ Configuración automática** que las apps pueden obtener al iniciar
- **✅ Guía completa** (`readme-android.md`) para desarrollo de apps Android

### 🔐 Autenticación
```bash
# Registro
POST /api/v1/auth/register
Content-Type: application/json
{
  "nombre": "Usuario Ejemplo",
  "email": "usuario@ejemplo.com", 
  "password": "password123",
  "role": "usuario"
}

# Login
POST /api/v1/auth/login
Content-Type: application/json
{
  "email": "usuario@ejemplo.com",
  "password": "password123"  
}
```

### 📰 Noticias

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| `GET` | `/api/v1/news` | Listar noticias (paginado) | No |
| `GET` | `/api/v1/news/:id` | Obtener noticia específica | No |
| `POST` | `/api/v1/news` | Crear noticia | Sí |
| `PUT` | `/api/v1/news/:id` | Actualizar noticia | Sí (colaborador+) |
| `DELETE` | `/api/v1/news/:id` | Eliminar noticia | Sí (admin) |

### 💬 Comunicaciones Multimedia

```bash
# Crear comunicación con archivos
POST /api/v1/com
Content-Type: multipart/form-data
Authorization: Bearer TOKEN

FormData:
- titulo: "Mi comunicación"
- descripcion: "Descripción del contenido"
- video: [archivo.mp4] (opcional, máx 200MB)
- image: [imagen1.jpg] (opcional)
- image: [imagen2.jpg] (opcional, hasta 6 imágenes)
```

### 👥 Gestión de Usuarios

| Método | Endpoint | Descripción | Rol Requerido |
|--------|----------|-------------|---------------|
| `GET` | `/api/v1/users` | Listar usuarios | Admin |
| `GET` | `/api/v1/users/profile` | Perfil actual | Usuario |
| `PUT` | `/api/v1/users/:id` | Actualizar usuario | Admin |
| `DELETE` | `/api/v1/users/:id` | Eliminar usuario | Admin |

## 🔐 Sistema de Autenticación

### Obtener Token JWT
```bash
curl -X POST https://tu-dominio.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@ejemplo.com", "password": "tu_password"}'

# Respuesta:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "nombre": "Administrador",
    "email": "admin@ejemplo.com",
    "role": "administrador"
  }
}
```

### Usar Token en Requests
```bash
curl -X GET https://tu-dominio.com/api/v1/users \
  -H "Authorization: Bearer TU_TOKEN_JWT_AQUI"
```

## 👥 Roles y Permisos

| Rol | Permisos |
|-----|----------|
| **usuario** | ✅ Crear noticias, comentarios, likes<br>✅ Crear comunicaciones<br>✅ Ver perfil propio |
| **colaborador** | ✅ Todo lo anterior<br>✅ Editar cualquier noticia<br>✅ Moderar comentarios |
| **administrador** | ✅ Todo lo anterior<br>✅ Gestionar usuarios<br>✅ Eliminar contenido<br>✅ Acceso a estadísticas |

## 📊 Paginación e Infinite Scroll

### Parámetros de Consulta
```bash
GET /api/v1/news?page=1&limit=10&sort=published_at&order=desc&tag=tecnologia
```

### Respuesta con Metadatos
```json
{
  "data": [
    {
      "id": 1,
      "titulo": "Noticia Ejemplo",
      "contenido": "...",
      "published_at": "2025-01-14T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1, 
    "limit": 10,
    "totalPages": 15,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## 🔧 Solución de Problemas

### 🚨 Problemas Comunes y Soluciones

#### ❌ Error 500 en Login
```bash
# Problema: Plugin JWT no registrado
# Solución: Verificar que src/app.js incluya:
fastify.register(require('@fastify/jwt'), {
  secret: config.jwt.secret
});
```

#### ❌ Errores WebAssembly
```bash
# Los errores como estos son normales y filtrados:
# "RangeError: WebAssembly.instantiate(): Out of memory"
# "💡 Error de WebAssembly/undici ignorado (esperado en hosting compartido)"
```

#### ❌ Error 503 Service Unavailable
```bash
# 1. Verificar estado del servidor
curl https://tu-dominio.com/health

# 2. Verificar configuración en cPanel > Setup Node.js App
# 3. Revisar logs de error en cPanel
```

### 📋 Verificación de Estado

```bash
# 1. Health check básico
curl https://tu-dominio.com/health
# Esperado: {"status":"OK","timestamp":"...","uptime":123}

# 2. Estado detallado
curl https://tu-dominio.com/api/v1/status
# Muestra: estado BD, memoria, entorno

# 3. Test de login
curl -X POST https://tu-dominio.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'
```

## 📱 Soporte para Apps Móviles

### 🎯 Endpoints Móviles Disponibles

Tu API ahora incluye **endpoints específicos optimizados para apps móviles**:

```bash
# Configuración de la app
GET /api/v1/mobile/config

# Health check optimizado
GET /api/v1/mobile/health

# Feed optimizado para móviles
GET /api/v1/mobile/feed?page=1&limit=10

# Login optimizado
POST /api/v1/mobile/login
```

### 📋 Guía para Desarrolladores Móviles

- **📱 [readme-android.md](readme-android.md)** - Guía completa paso a paso para conectar apps Android
- **🧪 `test-mobile-api.js`** - Script para verificar que todos los endpoints móviles funcionan
- **🌐 CORS configurado** - Permite conexiones desde cualquier app móvil
- **📊 Headers optimizados** - Mejor rendimiento en dispositivos móviles

### ✅ Verificación Rápida

```bash
# Probar endpoints móviles
node test-mobile-api.js

# Resultado esperado: 9/9 tests exitosos
```

## 🚀 Deployment en cPanel

### 📋 Checklist de Deployment

- [ ] ✅ Archivos subidos al servidor
- [ ] ✅ `.env` configurado con datos del hosting  
- [ ] ✅ Base de datos MySQL creada e importada
- [ ] ✅ `npm install` ejecutado
- [ ] ✅ `npm install undici@5.28.4 --save` ejecutado
- [ ] ✅ cPanel > Setup Node.js App configurado
- [ ] ✅ Startup File: `passenger_app.js`
- [ ] ✅ Aplicación reiniciada
- [ ] ✅ `/health` responde OK
- [ ] ✅ Login funciona correctamente

### 🔗 Scripts NPM Disponibles

```bash
# Desarrollo
npm run dev              # Nodemon para desarrollo
npm run start           # Inicio normal

# Producción/cPanel
npm run start:cpanel    # Optimizado para cPanel con anti-WASM
npm run start:safe      # Modo seguro con límites de memoria
npm run start:minimal   # Versión mínima sin Swagger

# Utilidades
npm run check          # Verificación de estado
npm test               # Ejecutar tests
```

## 📁 Estructura del Proyecto

```
cdelu.ar/
├── 📁 src/
│   ├── 📁 config/          # Configuración
│   ├── 📁 controllers/     # Controladores de API
│   ├── 📁 routes/          # Rutas de endpoints
│   ├── 📁 middlewares/     # Middlewares de auth
│   ├── 📁 services/        # Servicios (RSS, etc)
│   ├── 📄 app.js           # App principal con Swagger
│   ├── 📄 app.minimal.js   # App sin Swagger (fallback)
│   └── 📄 index.js         # Punto de entrada
├── 📁 public/              # Archivos estáticos
│   ├── 📄 dashboard.html   # Panel de administración
│   └── 📄 login.html       # Página de login
├── 📁 sql/                 # Scripts de base de datos
├── 📄 passenger_app.js     # Punto de entrada para cPanel
├── 📄 package.json         # Dependencias y scripts
├── 📄 .env                 # Variables de entorno
└── 📄 README.md            # Esta documentación
```

## 🤝 Contribuir

1. **Fork** del repositorio
2. **Crear rama** para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. **Commit** de tus cambios (`git commit -m 'Add: nueva funcionalidad'`)
4. **Push** a la rama (`git push origin feature/nueva-funcionalidad`)
5. **Pull Request** describiendo los cambios

## 📝 Changelog

Ver [CHANGELOG.md](CHANGELOG.md) para el historial completo de cambios.

### 🆕 Últimos Cambios (v1.2.0)
- 📱 **Soporte completo para apps móviles** con endpoints específicos
- 🌐 **CORS mejorado** para permitir conexiones desde apps Android/iOS
- 📋 **Guía Android completa** con documentación paso a paso
- 🧪 **Testing automatizado** para verificar endpoints móviles

### 🆕 Cambios Anteriores (v1.1.0)
- ✅ **Solución completa al sistema de login** (error 500 corregido)
- 🚀 **Errores WebAssembly solucionados** para hosting compartido
- ⚙️ **Optimizaciones para cPanel** con límites de memoria y fallbacks
- 📊 **Diagnóstico mejorado** con endpoints de health check

## 📞 Soporte

- **GitHub Issues**: [Reportar problemas](https://github.com/mati4315/cdelu.ar/issues)
- **Documentación**: [Ver docs en vivo](https://diario.trigamer.xyz/api/v1/docs)
- **Email**: dev@cdelu.ar

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

### 🔗 Links Útiles

- **🌐 Sitio en vivo**: [diario.trigamer.xyz](https://diario.trigamer.xyz)
- **📚 Documentación API**: [diario.trigamer.xyz/api/v1/docs](https://diario.trigamer.xyz/api/v1/docs)
- **📊 Dashboard**: [diario.trigamer.xyz/public/dashboard.html](https://diario.trigamer.xyz/public/dashboard.html)
- **📱 Guía Android**: [readme-android.md](readme-android.md) - Guía completa para apps móviles
- **💻 Repositorio**: [github.com/mati4315/cdelu.ar](https://github.com/mati4315/cdelu.ar)

---

> **¿Problemas?** Revisa el [CHANGELOG.md](CHANGELOG.md) y las [instrucciones de cPanel](INSTRUCCIONES_CPANEL_WEBASSEMBLY.md) para soluciones detalladas. 