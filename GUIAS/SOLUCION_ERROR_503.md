# 🚨 SOLUCIÓN PARA ERROR 503 EN CPANEL (PASSENGER) - ACTUALIZADA

## Problema actual
Tu aplicación está mostrando errores 503 (Service Unavailable) y 500 (Internal Server Error). **Tu hosting tiene Passenger configurado**, lo cual es excelente, pero necesitamos verificar la configuración.

## ⚡ **SOLUCIÓN RÁPIDA AUTOMÁTICA**

```bash
# Ejecutar en SSH o Terminal de cPanel
cd /home/trigamer/diario.trigamer.xyz
bash fix_cpanel_503.sh
```

## 🔍 **Problemas identificados en los logs:**

1. **Error de Sharp**: `Could not load the "sharp" module using the linux-x64 runtime`
2. **Error WebAssembly**: `Out of memory: Cannot allocate Wasm memory`
3. **Flags V8 obsoletos**: `unrecognized flag --wasm-write-protect-code-memory=false`
4. **MySQL2 obsoleto**: `acquireTimeout` ya no es válido

## ✅ **SOLUCIONES IMPLEMENTADAS:**

### 1. **Dependencias problemáticas removidas**
- ✅ Sharp y FFmpeg ahora son **opcionales**
- ✅ La aplicación funciona sin procesamiento de imágenes/videos
- ✅ `package.production.json` sin dependencias problemáticas

### 2. **Configuración de memoria optimizada**
- ✅ Límite de memoria reducido a 512MB (era 700MB)
- ✅ Flags V8 obsoletos removidos
- ✅ WebAssembly configurado conservadoramente

### 3. **Base de datos corregida**
- ✅ `acquireTimeout` removido de la configuración MySQL2
- ✅ Pool de conexiones reducido para hosting compartido

## 📋 **PASOS MANUALES DESPUÉS DEL SCRIPT:**

### 1. Configurar variables de entorno en cPanel
1. Ve a **cPanel > Setup Node.js App**
2. Busca tu aplicación `diario.trigamer.xyz`
3. Haz clic en **"Edit"** o **"Editar"**
4. En **"Environment Variables"**, añade:

```
NODE_ENV=production
DB_HOST=localhost
DB_USER=tu_usuario_mysql
DB_PASSWORD=tu_contraseña_mysql
DB_NAME=tu_base_datos
JWT_SECRET=clave_secreta_muy_segura
CORS_ORIGIN=https://diario.trigamer.xyz
PORT=3001
```

### 2. Reiniciar la aplicación
1. En **cPanel > Setup Node.js App**
2. Haz clic en **"Restart"**
3. Verifica que el estado sea **"Running"**

### 3. Verificar funcionamiento
Visita estos endpoints para confirmar:
- `https://diario.trigamer.xyz/health` - Health check básico
- `https://diario.trigamer.xyz/api/v1/status` - Diagnóstico detallado
- `https://diario.trigamer.xyz/api/v1/docs` - Documentación de API

## 🔧 **COMANDOS DE DIAGNÓSTICO:**

```bash
# Diagnóstico específico de Passenger
node check_passenger_status.js

# Si persisten problemas, usar servidor de emergencia
node emergency_start.js
```

## 🚨 **SI AÚN HAY PROBLEMAS:**

### Problema: Error de memoria WebAssembly
**Solución**: El `passenger_app.js` ya está optimizado, pero si persiste:
1. Contacta al soporte técnico del hosting
2. Solicita aumento de límite de memoria
3. Usa `emergency_start.js` temporalmente

### Problema: Sharp/FFmpeg aún causan errores
**Solución**: Ya están configurados como opcionales, pero si aparecen:
1. Verifica que usaste `package.production.json`
2. Ejecuta: `npm ci --production --no-optional --ignore-scripts`
3. Reinicia la aplicación

### Problema: Base de datos no conecta
**Solución**:
1. Verifica las credenciales en variables de entorno
2. Asegúrate de que la base de datos esté creada
3. Verifica permisos del usuario de BD

## 📊 **CONFIGURACIÓN OPTIMIZADA ACTUAL:**

- **Memoria V8**: 512MB (reducido para hosting compartido)
- **Pool de BD**: 5 conexiones (reducido de 10)
- **Dependencias**: Solo las esenciales (sin Sharp/FFmpeg)
- **Flags V8**: Solo compatibles con Node.js 20
- **WebAssembly**: Configuración conservadora

## 🎯 **FUNCIONALIDADES AFECTADAS:**

### ✅ **Funcionan normalmente:**
- API REST completa
- Autenticación JWT
- CRUD de noticias
- Sistema de usuarios
- Documentación Swagger
- CORS configurado

### ⚠️ **Limitaciones temporales:**
- Subida de imágenes: se guardan sin optimización
- Subida de videos: se guardan sin compresión
- (Funcionalidad básica mantenida)

## 📞 **INFORMACIÓN PARA SOPORTE TÉCNICO:**

Si necesitas contactar al soporte:

**Configuración actual:**
- Hosting: CloudLinux con Passenger
- Node.js: Versión 20
- Directorio: `/home/trigamer/diario.trigamer.xyz`
- Archivo de inicio: `passenger_app.js`

**Errores específicos resueltos:**
- Sharp: Configurado como opcional
- WebAssembly: Límites de memoria ajustados
- V8 Flags: Solo compatibles incluidos
- MySQL2: Configuración actualizada

**Logs a revisar:**
- Resultado de `check_passenger_status.js`
- Logs de error de cPanel
- Estado en Setup Node.js App 