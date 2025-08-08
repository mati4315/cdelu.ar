# 📸 FUNCIONALIDAD DE FOTOS DE PERFIL

## 🎯 Descripción General

Esta funcionalidad permite a los usuarios subir, actualizar, consultar y eliminar sus fotos de perfil. El sistema incluye validación de archivos, procesamiento de imágenes, almacenamiento seguro y endpoints API completos.

## 🔧 Arquitectura de la Implementación

### 1. **Migración de Base de Datos**
Se agregó una nueva columna a la tabla `users`:

```sql
ALTER TABLE users 
ADD COLUMN profile_picture_url VARCHAR(500) NULL 
COMMENT 'URL de la foto de perfil del usuario'
AFTER password;
```

### 2. **Estructura de Archivos Creados**

```
src/
├── controllers/
│   └── userController.js          # Controlador para gestión de fotos de perfil
├── routes/
│   └── profile.routes.js          # Rutas de la API de perfiles
└── middlewares/
    └── profileValidation.js       # Validación de archivos y autenticación

public/
└── uploads/
    └── profile-pictures/          # Directorio para almacenar fotos de perfil

sql/
└── add-profile-picture-migration.sql  # Script SQL de migración

Scripts:
├── apply-profile-picture-migration.js  # Aplicar migración automáticamente
└── test-profile-pictures.js           # Script de pruebas completo
```

## 🚀 Endpoints Disponibles

### **POST /api/v1/profile/picture**
Subir o actualizar foto de perfil del usuario autenticado.

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
Content-Type: multipart/form-data
```

**Body (FormData):**
```
profile_picture: [archivo de imagen]
```

**Respuesta Exitosa (200):**
```json
{
  "message": "Foto de perfil actualizada correctamente",
  "profile_picture_url": "/uploads/profile-pictures/profile-1642345678901-123456789.jpg"
}
```

### **DELETE /api/v1/profile/picture**
Eliminar foto de perfil del usuario autenticado.

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Respuesta Exitosa (200):**
```json
{
  "message": "Foto de perfil eliminada correctamente"
}
```

### **GET /api/v1/profile/me**
Obtener perfil completo del usuario autenticado.

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Respuesta Exitosa (200):**
```json
{
  "user": {
    "id": 123,
    "nombre": "Juan Pérez",
    "email": "juan@example.com",
    "rol": "usuario",
    "profile_picture_url": "/uploads/profile-pictures/profile-1642345678901-123456789.jpg",
    "created_at": "2025-01-15T10:30:00.000Z",
    "updated_at": "2025-01-15T15:45:00.000Z"
  }
}
```

### **GET /api/v1/profile/:userId**
Obtener perfil público de un usuario por ID.

**Parámetros:**
- `userId`: ID del usuario

**Respuesta Exitosa (200):**
```json
{
  "user": {
    "id": 123,
    "nombre": "Juan Pérez",
    "rol": "usuario",
    "profile_picture_url": "/uploads/profile-pictures/profile-1642345678901-123456789.jpg",
    "created_at": "2025-01-15T10:30:00.000Z"
  }
}
```

## 🔒 Validaciones y Seguridad

### **Validación de Archivos**
- **Tipos permitidos:** JPG, JPEG, PNG, WebP
- **Tamaño máximo:** 5MB por archivo
- **Tamaño mínimo:** 1KB
- **Procesamiento:** Redimensionado automático a 300x300px (si Sharp está disponible)
- **Formato de salida:** JPG optimizado con calidad 85%

### **Seguridad**
- ✅ Autenticación JWT requerida para operaciones
- ✅ Validación de tipos MIME y extensiones
- ✅ Limitación de velocidad: 5 subidas por minuto por usuario
- ✅ Eliminación automática de fotos anteriores al subir nueva
- ✅ Nombres de archivo únicos para evitar conflictos
- ✅ Directorio de subida protegido

### **Middleware de Validación**
```javascript
// Validación automática en cada subida
const { validateProfilePicture, requireAuthentication } = require('../middlewares/profileValidation');

// Uso en rutas
preHandler: [requireAuthentication, validateProfilePicture]
```

## 🔄 Integración con Sistema Existente

### **Actualización del AuthController**
El controlador de autenticación se actualizó para incluir el campo `profile_picture_url` en las respuestas de login y registro:

```javascript
// En login
const responseData = {
  token,
  user: {
    id: user.id,
    nombre: user.nombre,
    email: user.email,
    rol: user.rol,
    profile_picture_url: user.profile_picture_url  // ← Nuevo campo
  }
};

// En registro
reply.status(201).send({
  token,
  user: {
    id: result.insertId,
    nombre,
    email,
    rol,
    profile_picture_url: null  // ← Campo inicial
  }
});
```

### **Registro de Rutas**
Las nuevas rutas se registran automáticamente en `src/app.js`:

```javascript
const profileRoutes = require('./routes/profile.routes.js');
// ...
fastify.register(profileRoutes, { prefix: '/api/v1/profile' });
```

## 📋 Proceso de Instalación

### **1. Aplicar Migración de Base de Datos**
```bash
# Ejecutar script de migración
node apply-profile-picture-migration.js
```

O manualmente:
```bash
# Ejecutar SQL directamente
mysql -u [usuario] -p [base_de_datos] < sql/add-profile-picture-migration.sql
```

### **2. Verificar Instalación**
```bash
# Ejecutar tests completos
node test-profile-pictures.js
```

### **3. Dependencias**
La funcionalidad usa dependencias ya existentes en el proyecto:
- `@fastify/multipart` - Para subida de archivos
- `sharp` (opcional) - Para procesamiento de imágenes
- Sistema de autenticación JWT existente

## 🧪 Testing

### **Ejecutar Tests**
```bash
# Asegurarse de que el servidor esté corriendo en localhost:3000
npm start

# En otra terminal, ejecutar tests
node test-profile-pictures.js
```

### **Tests Incluidos**
1. ✅ Registro/Login de usuario
2. ✅ Consulta de perfil sin foto
3. ✅ Subida de foto de perfil
4. ✅ Verificación de perfil con foto
5. ✅ Consulta de perfil público
6. ✅ Eliminación de foto de perfil
7. ✅ Verificación de perfil sin foto

## 🛠️ Funcionalidades Técnicas

### **Procesamiento de Imágenes**
- **Con Sharp:** Redimensionado automático, optimización de calidad, conversión a JPG
- **Sin Sharp:** Almacenamiento directo (para compatibilidad con hosting básico)

### **Gestión de Archivos**
- Nombres únicos usando timestamp + random
- Eliminación automática de archivos anteriores
- Directorio organizado: `public/uploads/profile-pictures/`

### **Manejo de Errores**
- Validación de archivos antes del procesamiento
- Respuestas de error detalladas y en español
- Limpieza automática en caso de errores

## 📖 Ejemplo de Uso

### **Frontend - Subir Foto de Perfil**
```javascript
// HTML
<input type="file" id="profilePicture" accept="image/*">
<button onclick="uploadProfilePicture()">Subir Foto</button>

// JavaScript
async function uploadProfilePicture() {
  const fileInput = document.getElementById('profilePicture');
  const file = fileInput.files[0];
  
  if (!file) {
    alert('Seleccione una imagen');
    return;
  }

  const formData = new FormData();
  formData.append('profile_picture', file);

  try {
    const response = await fetch('/api/v1/profile/picture', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userToken}`
      },
      body: formData
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('Foto subida:', result.profile_picture_url);
      // Actualizar UI con nueva foto
    } else {
      console.error('Error:', result.error);
    }
  } catch (error) {
    console.error('Error de red:', error);
  }
}
```

### **Frontend - Mostrar Foto de Perfil**
```javascript
async function loadUserProfile() {
  try {
    const response = await fetch('/api/v1/profile/me', {
      headers: {
        'Authorization': `Bearer ${userToken}`
      }
    });

    const result = await response.json();
    
    if (response.ok) {
      const user = result.user;
      
      // Mostrar foto de perfil o placeholder
      const profileImg = document.getElementById('profileImage');
      profileImg.src = user.profile_picture_url || '/default-avatar.png';
      
      // Mostrar datos del usuario
      document.getElementById('userName').textContent = user.nombre;
      document.getElementById('userEmail').textContent = user.email;
    }
  } catch (error) {
    console.error('Error al cargar perfil:', error);
  }
}
```

## 🔄 Mantenimiento

### **Limpieza de Archivos Huérfanos**
Si es necesario limpiar archivos que no están referenciados en la base de datos:

```javascript
// Script de limpieza (ejemplo)
const fs = require('fs');
const path = require('path');
const pool = require('./src/config/database');

async function cleanOrphanedFiles() {
  const uploadDir = path.join(__dirname, 'public/uploads/profile-pictures');
  const files = fs.readdirSync(uploadDir);
  
  const [users] = await pool.query('SELECT profile_picture_url FROM users WHERE profile_picture_url IS NOT NULL');
  const usedFiles = users.map(u => path.basename(u.profile_picture_url));
  
  for (const file of files) {
    if (!usedFiles.includes(file)) {
      fs.unlinkSync(path.join(uploadDir, file));
      console.log(`Archivo huérfano eliminado: ${file}`);
    }
  }
}
```

## 📊 Métricas y Monitoreo

### **Logs Importantes**
- ✅ Subidas exitosas con tamaño de archivo
- ⚠️ Intentos de subida con archivos inválidos
- ❌ Errores de procesamiento de imágenes
- 🔄 Eliminaciones de fotos de perfil

### **Métricas Sugeridas**
- Número de usuarios con foto de perfil
- Tamaño promedio de archivos subidos
- Frecuencia de cambio de fotos de perfil
- Errores de validación más comunes

---

## ✅ Estado de Implementación

- ✅ **Migración de base de datos:** Completada
- ✅ **Controladores:** Implementados
- ✅ **Rutas API:** Configuradas
- ✅ **Validaciones:** Implementadas
- ✅ **Middleware:** Configurado
- ✅ **Tests:** Creados y verificados
- ✅ **Documentación:** Completada
- ✅ **Integración:** Lista para producción

La funcionalidad de fotos de perfil está **completamente implementada** y lista para usar. Los usuarios pueden subir, actualizar, consultar y eliminar sus fotos de perfil de forma segura y eficiente. 