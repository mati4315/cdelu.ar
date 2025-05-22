# CdelU - Diario Digital

## Información General
Esta es la plataforma para el diario digital CdelU, desarrollada con Node.js, Fastify y MySQL.

## Configuración para Desarrollo

### Requisitos previos
- Node.js (v14 o superior)
- MySQL (v5.7 o superior)

### Instalación
1. Clonar el repositorio:
   ```bash
   git clone <url-del-repositorio>
   cd cdelu.ar
   ```

2. Instalar dependencias:
   ```bash
   npm install
   ```

3. Configurar variables de entorno:
   ```bash
   cp .env.example .env
   ```
   Editar el archivo `.env` con la configuración adecuada.

4. Iniciar la aplicación en modo desarrollo:
   ```bash
   npm run dev
   ```

## Despliegue en Producción (cPanel + Passenger)

### Preparación
1. Asegúrate de tener una cuenta de cPanel con soporte para Node.js (Passenger).
2. Configura un subdominio o dominio para la aplicación.
3. Configura una base de datos MySQL en cPanel.

### Archivos de Configuración
- `.env.production`: Contiene la configuración para el entorno de producción.
- `.htaccess`: Configuración de Apache para Passenger y rutas.
- `passenger_app.js`: Punto de entrada para Passenger.

### Pasos para el Despliegue
1. Subir todos los archivos al servidor utilizando FTP o el Administrador de Archivos de cPanel.
2. Configurar `.env.production` con los datos correctos (base de datos, JWT, etc.)
3. Ejecutar el siguiente comando para preparar el entorno:
   ```bash
   cp .env.production .env
   ```
4. Reiniciar la aplicación desde el panel de Node.js en cPanel.

## Herramientas de Diagnóstico

### Scripts de Diagnóstico
Se han incluido varios scripts para ayudar a diagnosticar problemas comunes:

1. **troubleshoot.js**: Diagnóstico completo del sistema
   ```bash
   node troubleshoot.js
   ```
   Este script verifica:
   - Archivos críticos del sistema
   - Variables de entorno
   - Conexión a la base de datos
   - Estructura de archivos

2. **check_passenger.js**: Verificación de la configuración de Passenger
   ```bash
   node check_passenger.js
   ```
   Este script verifica:
   - Configuración de Apache (.htaccess)
   - Archivo de inicio (passenger_app.js)
   - Configuración de puertos y CORS

3. **restart_app.sh**: Script para reiniciar la aplicación en cPanel
   ```bash
   bash restart_app.sh
   ```
   Este script:
   - Realiza una copia de seguridad de la configuración actual
   - Aplica la configuración de producción
   - Reinicia la aplicación Node.js

### Solución de Problemas Comunes

#### Error 503 (Service Unavailable)
Posibles causas:
- La aplicación Node.js no está ejecutándose
- Problemas con la configuración de Passenger
- Error en el archivo de inicio

Soluciones:
1. Verificar los logs de Apache en cPanel
2. Ejecutar `node troubleshoot.js` para diagnóstico completo
3. Verificar que Passenger está configurado correctamente en `.htaccess`

#### Error 500 en API
Posibles causas:
- Problemas de conexión a la base de datos
- Error en la ejecución de consultas
- Configuración incorrecta

Soluciones:
1. Verificar credenciales de la base de datos en `.env`
2. Ejecutar `node troubleshoot.js` para verificar la conexión
3. Revisar los logs de la aplicación

#### Problemas de CORS
Posibles causas:
- Configuración incorrecta de CORS
- Headers no configurados correctamente

Soluciones:
1. Verificar la configuración CORS en `src/config/default.js`
2. Revisar los headers en `.htaccess`

## Cambios Recientes

### Mejoras de Estabilidad
- Mejor manejo de errores en la conexión a la base de datos
- Implementación de reintentos de conexión
- Optimización de configuración CORS

### Corrección de Rutas API
- Configuración correcta de rutas API en `.htaccess`
- Mejora en la gestión de solicitudes OPTIONS (preflight)
- Corrección de redirecciones para archivos estáticos

### Optimización de Recursos
- Configuración de límites de memoria en `passenger_app.js`
- Mejora en la gestión de GC para reducir el consumo de memoria

## Contribución
1. Crear una rama para tu característica (`git checkout -b feature/nueva-caracteristica`)
2. Hacer commit de tus cambios (`git commit -m 'Añade nueva característica'`)
3. Hacer push a la rama (`git push origin feature/nueva-caracteristica`)
4. Crear un Pull Request 