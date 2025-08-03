# 🎰 Sistema de Anuncios de Lotería

## 📋 Descripción

Este sistema implementa un anuncio especial que se habilita automáticamente cuando hay una o más loterías activas en el sistema. El anuncio se actualiza dinámicamente y se muestra en el dashboard administrativo.

## 🚀 Características

### ✅ Funcionalidades Implementadas

1. **Worker Automático**: Se ejecuta cada 5 minutos para verificar loterías activas
2. **Anuncio Dinámico**: Se crea/actualiza automáticamente según el estado de las loterías
3. **Banner Visual**: Se muestra en el dashboard cuando hay loterías activas
4. **Contador Dinámico**: Muestra el número exacto de loterías activas
5. **Enlace Directo**: Botón que lleva directamente a la página de loterías

### 🎯 Comportamiento

- **Con Loterías Activas**: El banner se muestra con el contador y descripción actualizada
- **Sin Loterías Activas**: El banner se oculta automáticamente
- **Actualización Automática**: Se actualiza cada 5 minutos sin intervención manual

## 📁 Archivos Creados

### Backend
- `src/workers/lotteryAdWorker.js` - Worker que gestiona anuncios automáticamente
- `create-lottery-ad.js` - Script para gestión manual de anuncios
- `test-lottery-ad-system.js` - Script de pruebas del sistema
- `test-lottery-ad-integration.js` - Script de pruebas de integración

### Frontend
- Modificaciones en `public/dashboard.html`:
  - Banner visual con estilos CSS
  - Funcionalidad JavaScript para mostrar/ocultar
  - Integración con el sistema de loterías existente

## 🔧 Instalación y Configuración

### 1. Verificar Dependencias

```bash
# Asegúrate de que tienes axios instalado
npm install axios
```

### 2. Configurar el Worker

El worker ya está integrado en `src/index.js` y se ejecuta automáticamente cada 5 minutos.

### 3. Verificar Base de Datos

Asegúrate de que la tabla `ads` existe con la estructura correcta:

```sql
CREATE TABLE IF NOT EXISTS ads (
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

## 🧪 Pruebas

### Ejecutar Pruebas del Sistema

```bash
# Probar el sistema completo
node test-lottery-ad-system.js

# Probar integración
node test-lottery-ad-integration.js

# Ejecutar worker manualmente
node create-lottery-ad.js

# Ejecutar worker en modo automático
node create-lottery-ad.js --auto
```

### Verificar Funcionamiento

1. **Crear una lotería activa** en el sistema
2. **Esperar 5 minutos** o ejecutar el worker manualmente
3. **Verificar el dashboard** - debe aparecer el banner
4. **Finalizar la lotería** - el banner debe desaparecer

## 📊 Estructura del Anuncio

### Campos del Anuncio

```json
{
  "titulo": "🎰 ¡Loterías Activas!",
  "descripcion": "¡Participa en nuestras X lotería(s) activa(s) con premios increíbles!",
  "enlace_destino": "/lottery.html",
  "texto_opcional": "Anuncio dinámico - X lotería(s) activa(s)",
  "categoria": "eventos",
  "prioridad": 3,
  "activo": true,
  "impresiones_maximas": 0
}
```

### Lógica de Activación

- **activo**: `true` si hay loterías activas, `false` si no hay
- **descripcion**: Se actualiza dinámicamente con el número de loterías
- **texto_opcional**: Incluye el contador de loterías activas

## 🎨 Componentes Visuales

### Banner en Dashboard

```html
<div id="lotteryAdBanner" class="mb-4" style="display: none;">
    <div class="card lottery-ad-card">
        <div class="card-body">
            <div class="d-flex align-items-center justify-content-between">
                <div class="d-flex align-items-center">
                    <div class="lottery-ad-icon me-3">
                        <i class="bi bi-trophy-fill text-warning"></i>
                    </div>
                    <div>
                        <h5 class="mb-1 lottery-ad-title">🎰 ¡Loterías Activas!</h5>
                        <p class="mb-0 lottery-ad-description">¡Participa en nuestras loterías activas con premios increíbles!</p>
                    </div>
                </div>
                <div class="d-flex align-items-center">
                    <span class="badge bg-success me-3 lottery-ad-badge">
                        <i class="bi bi-play-circle me-1"></i>
                        <span id="activeLotteriesCount">0</span> Activa<span id="activeLotteriesPlural">s</span>
                    </span>
                    <a href="/lottery.html" class="btn btn-primary btn-sm">
                        <i class="bi bi-arrow-right me-1"></i>
                        Participar
                    </a>
                </div>
            </div>
        </div>
    </div>
</div>
```

### Estilos CSS

```css
.lottery-ad-card {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    border-radius: var(--border-radius-lg);
    color: white;
    box-shadow: var(--shadow-lg);
    transition: var(--transition);
}

.lottery-ad-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}
```

## 🔄 Flujo de Funcionamiento

1. **Worker se ejecuta** cada 5 minutos
2. **Verifica loterías activas** en la base de datos
3. **Busca anuncio existente** de lotería
4. **Crea o actualiza** el anuncio según el estado
5. **Frontend detecta cambios** y muestra/oculta el banner
6. **Usuario ve el banner** cuando hay loterías activas

## 🛠️ Mantenimiento

### Logs del Worker

El worker registra todas las acciones en la consola:

```
🎰 LotteryAdWorker: Iniciando verificación...
🎰 LotteryAdWorker: 2 loterías activas encontradas
🔄 LotteryAdWorker: Anuncio de lotería actualizado (ID: 123)
📊 Estado: ACTIVO
✅ LotteryAdWorker: Proceso completado - Anuncio ID: 123
```

### Monitoreo

- **Verificar logs** del servidor para el worker
- **Revisar tabla ads** para anuncios de lotería
- **Comprobar dashboard** para visualización del banner

## 🚨 Solución de Problemas

### Problema: Banner no aparece
- Verificar que hay loterías activas
- Comprobar que el worker está ejecutándose
- Revisar logs del servidor

### Problema: Banner no se actualiza
- Verificar que la función `updateLotteryAdBanner` se ejecuta
- Comprobar que las loterías tienen `status: 'active'` y `current_status: 'running'`

### Problema: Worker no funciona
- Verificar conexión a la base de datos
- Comprobar que el worker está integrado en `src/index.js`
- Revisar logs de errores

## 📈 Métricas

El sistema registra:
- **Número de loterías activas**
- **Estado del anuncio** (activo/inactivo)
- **Frecuencia de actualizaciones**
- **Interacciones con el banner**

## 🎯 Próximas Mejoras

1. **Notificaciones push** cuando se activa el banner
2. **Estadísticas detalladas** de interacciones
3. **Personalización del banner** por administrador
4. **Integración con redes sociales**
5. **A/B testing** de diferentes versiones del banner

---

**¡El sistema está listo para usar!** 🎉 