# 🗑️ Funcionalidad de Cancelar y Eliminar Loterías

## ✅ Implementación Completada

### 🚀 Nuevos Endpoints del Backend

#### 1. **PUT /api/v1/lotteries/:id/cancel**
- **Descripción**: Cancela una lotería activa o en borrador
- **Autenticación**: Requerida (JWT)
- **Permisos**: Solo el creador o administradores
- **Estados válidos**: `draft`, `active`

**Funcionalidad**:
- Cambia el estado de la lotería a `cancelled`
- Procesa reembolsos automáticos (tickets `paid` → `refunded`)
- Limpia reservas temporales
- Actualiza timestamp `updated_at`

**Respuesta exitosa**:
```json
{
  "success": true,
  "message": "Lotería cancelada exitosamente. Se procesaron 3 reembolsos.",
  "data": {
    "id": 5,
    "status": "cancelled",
    "refunded_tickets": 3
  }
}
```

#### 2. **DELETE /api/v1/lotteries/:id**
- **Descripción**: Elimina completamente una lotería de la base de datos
- **Autenticación**: Requerida (JWT)
- **Permisos**: Solo el creador o administradores
- **Estados válidos**: `draft`, `cancelled`

**Funcionalidad**:
- Elimina todos los datos relacionados en cascada:
  - `lottery_reserved_numbers`
  - `lottery_tickets`
  - `lottery_winners`
  - `lotteries`
- Validación de seguridad: No permite eliminar loterías con tickets vendidos

**Respuesta exitosa**:
```json
{
  "success": true,
  "message": "Lotería eliminada exitosamente",
  "data": {
    "id": 5,
    "title": "Mi Lotería"
  }
}
```

### 🎨 Frontend - Botones Dinámicos

Los botones aparecen según el estado de la lotería:

#### **Loterías en Draft (`draft`)**
- 👁️ **Ver detalles**
- ✏️ **Editar** 
- ▶️ **Activar**
- 🗑️ **Eliminar** ← **NUEVO**

#### **Loterías Activas (`active`)**
- 👁️ **Ver detalles**
- 🚫 **Cancelar** ← **NUEVO**
- 🗑️ **Eliminar (con tickets)** ← **NUEVO**

#### **Loterías Canceladas (`cancelled`)**
- 👁️ **Ver detalles**
- 🗑️ **Eliminar** ← **NUEVO**

#### **Loterías Vencidas (`overdue`)**
- 👁️ **Ver detalles**
- 🏆 **Finalizar**
- 🗑️ **Eliminar** ← **NUEVO**

#### **Loterías Finalizadas (`finished`)**
- 👁️ **Ver detalles**
- 🗑️ **Eliminar** ← **NUEVO**

### 🔒 Reglas de Negocio

#### **Cancelación**
- ✅ **Permitida**: Loterías en `draft` o `active`
- ❌ **No permitida**: Loterías `finished`, `cancelled`, `overdue`
- 🔄 **Proceso automático**:
  1. Cambio de estado a `cancelled`
  2. Reembolso de tickets pagados
  3. Limpieza de reservas temporales
  4. Notificación de cantidad de reembolsos

#### **Eliminación**
- ✅ **Permitida**: Loterías en **cualquier estado** (`draft`, `active`, `cancelled`, `finished`, `overdue`)
- ⚠️ **NUEVO**: Permite eliminar loterías con tickets vendidos
- 🗑️ **Proceso destructivo**:
  1. Eliminación de todos los datos relacionados
  2. Incluye tickets vendidos, ganadores, historial completo
  3. Eliminación de la lotería
  4. **No se puede deshacer**
- 🛡️ **Medidas de seguridad**: Confirmaciones dobles para loterías con tickets

#### **Permisos**
- 👤 **Creador**: Puede cancelar/eliminar sus propias loterías
- 👑 **Administrador**: Puede cancelar/eliminar cualquier lotería
- 🚫 **Usuario normal**: Sin acceso a estas funciones

### 🧪 Validaciones Implementadas

#### **Backend**
```javascript
// Validación de estado para cancelación
if (!['draft', 'active'].includes(lottery.status)) {
  return error('No se puede cancelar esta lotería');
}

// Validación de estado para eliminación
if (!['draft', 'cancelled'].includes(lottery.status)) {
  return error('Solo se pueden eliminar loterías en borrador o canceladas');
}

// Validación de permisos
if (lottery.created_by !== userId && user.rol !== 'administrador') {
  return error('No tiene permisos para esta acción');
}

// Validación de seguridad para eliminación
if (soldTicketsCount > 0) {
  return error('No se puede eliminar una lotería con tickets vendidos');
}
```

#### **Frontend**
```javascript
// Confirmaciones de usuario
if (!confirm('¿Estás seguro de que quieres cancelar esta lotería? Se procesarán reembolsos automáticamente.')) {
  return;
}

// Confirmación simple para loterías sin tickets
if (!confirm('¿Estás seguro de que quieres eliminar esta lotería? Esta acción no se puede deshacer.')) {
  return;
}

// Confirmación doble para loterías con tickets vendidos
if (hasTicketsSold) {
  const finalConfirm = prompt(
    'Para confirmar que entiendes las consecuencias, escribe: ELIMINAR\n\n' +
    `(Se eliminarán ${lottery.tickets_sold} tickets vendidos)`
  );
  
  if (finalConfirm !== 'ELIMINAR') {
    showAlert('Eliminación cancelada', 'info');
    return;
  }
}
```

### 🎯 Casos de Uso

#### **Cancelar Lotería**
1. **Caso típico**: Lotería activa que no está teniendo participación
2. **Resultado**: Estado `cancelled`, reembolsos automáticos
3. **Beneficio**: Los usuarios recuperan su dinero automáticamente

#### **Eliminar Lotería**
1. **Draft**: Lotería creada por error o en pruebas
2. **Cancelled**: Limpieza de loterías canceladas antiguas
3. **Resultado**: Eliminación completa de la base de datos
4. **Beneficio**: Mantiene la base de datos limpia

### 📱 Interfaz de Usuario

#### **Botones con Iconos**
- 🚫 **Cancelar**: Icono `fa-ban`, color `btn-outline-danger`
- 🗑️ **Eliminar**: Icono `fa-trash`, color `btn-outline-danger`
- 📝 **Tooltips**: Hover muestra descripción de la acción

#### **Confirmaciones**
- ⚠️ **Cancelar**: Alerta sobre reembolsos automáticos
- ⚠️ **Eliminar**: Alerta sobre acción irreversible

#### **Feedback Visual**
- ✅ **Éxito**: Alert verde con mensaje de confirmación
- ❌ **Error**: Alert rojo con mensaje de error específico
- 🔄 **Recarga**: Lista se actualiza automáticamente

### 🔄 Flujo de Trabajo Típico

#### **Administrador creando lotería**:
1. 📝 Crea lotería (estado: `draft`)
2. ✏️ Edita si es necesario
3. ▶️ Activa cuando está lista (estado: `active`)
4. 👥 Usuarios participan
5. **Opciones**:
   - 🏆 Finaliza normalmente cuando llega la fecha
   - 🚫 Cancela si no hay participación suficiente

#### **Limpieza de pruebas**:
1. 📝 Crea lotería de prueba (estado: `draft`)
2. 🗑️ Elimina inmediatamente sin activar
3. ✨ Base de datos queda limpia

### 🛡️ Seguridad

#### **⚠️ ACTUALIZADO: Nuevas Medidas de Seguridad**
- 🔍 **Detección automática**: El frontend verifica si hay tickets vendidos antes de eliminar
- ⚠️ **Advertencias específicas**: Muestra cantidad exacta de tickets que se perderán  
- 🔐 **Confirmación doble**: Requiere escribir "ELIMINAR" para loterías con tickets
- 📋 **Información clara**: Detalla todas las consecuencias antes de proceder

#### **Prevención de Errores**
- ✅ **Permitido pero protegido**: Se puede eliminar cualquier lotería con confirmaciones apropiadas
- ⚠️ **Advertencias dinámicas**: Mensajes específicos según el estado de la lotería
- 🛑 **Cancelación fácil**: Usuario puede cancelar en cualquier momento del proceso

#### **Auditoria**
- 📊 Los reembolsos quedan registrados (`payment_status: 'refunded'`)
- 🕐 Timestamps de actualización en todas las operaciones
- 👤 Logs de quién realizó la acción
- 🗑️ **NUEVO**: Logs especiales para eliminaciones con tickets vendidos

### 📋 Resumen de Archivos Modificados

#### **Backend**
- `src/controllers/lotteryController.js`: Métodos `cancelLottery()` y `deleteLottery()`
- `src/routes/lottery.routes.js`: Rutas PUT `/cancel` y DELETE `/:id`

#### **Frontend** 
- `public/lottery-admin.html`: Botones dinámicos y funciones JavaScript

#### **Pruebas**
- `test-cancel-delete-endpoints.js`: Batería completa de pruebas

## 🎉 Estado Final

✅ **Funcionalidad 100% Implementada**  
✅ **Probada y Funcionando**  
✅ **Segura y Validada**  
✅ **Interfaz Intuitiva**  

Los administradores ahora pueden gestionar el ciclo de vida completo de las loterías con control total sobre cancelaciones y eliminaciones. 