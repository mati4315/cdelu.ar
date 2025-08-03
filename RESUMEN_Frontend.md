# 🎰 Resumen Completo - Frontend del Sistema de Loterías

## 📋 Información General

### **Base URL de la API**
```
http://localhost:3001/api/v1
```

### **Prefijo de Rutas de Loterías**
```
/api/v1/lotteries
```

## 🔐 Autenticación

### **Login de Administrador**
```javascript
// POST /api/v1/auth/login
const loginResponse = await axios.post('/api/v1/auth/login', {
  email: 'admin@cdelu.ar',
  password: 'admin123'
});

const token = loginResponse.data.token;

// Usar en todas las peticiones protegidas
const headers = { 
  Authorization: `Bearer ${token}` 
};
```

### **Verificación de Rol**
```javascript
// El usuario debe tener rol 'administrador' para gestionar loterías
// Verificar en: loginResponse.data.user.rol === 'administrador'
```

## 🎯 Estados de Loterías

### **Estados Disponibles**
```javascript
const LOTTERY_STATES = {
  DRAFT: 'draft',        // Borrador - Editable completamente
  ACTIVE: 'active',      // Activa - Usuarios pueden participar
  CANCELLED: 'cancelled',// Cancelada - Editable y reanudable
  FINISHED: 'finished',  // Finalizada - Solo eliminable
  OVERDUE: 'overdue',    // Vencida - Puede finalizarse
  RUNNING: 'running'     // En ejecución (sorteo en curso)
};
```

### **Transiciones de Estado Permitidas**
```javascript
// draft → active (activar)
// active → cancelled (cancelar)
// cancelled → draft (reanudar como borrador)
// cancelled → active (reanudar como activa)
// active → finished (finalizar)
// overdue → finished (finalizar)
```

## 📊 Estructura de Datos de Lotería

### **Objeto Lotería Completo**
```javascript
const lottery = {
  id: 1,
  title: "Lotería de Año Nuevo",
  description: "Gran sorteo con premios increíbles",
  image_url: "https://example.com/image.jpg",
  is_free: false,                    // true=gratis, false=paga
  ticket_price: 100.00,              // Precio en moneda local
  min_tickets: 1,                    // Mínimo tickets para participar
  max_tickets: 1000,                 // Máximo tickets disponibles
  num_winners: 3,                    // Cantidad de ganadores
  tickets_sold: 150,                 // Tickets vendidos actualmente
  start_date: "2024-01-01T00:00:00.000Z",  // ISO 8601
  end_date: "2024-01-31T23:59:59.000Z",    // ISO 8601
  status: "active",                  // Estado actual
  created_by: 1,                     // ID del usuario creador
  prize_description: "iPhone 15 Pro, MacBook y $10,000",
  terms_conditions: "Términos y condiciones completos...",
  created_at: "2024-01-01T00:00:00.000Z",
  updated_at: "2024-01-01T00:00:00.000Z"
};
```

## 🛠️ Endpoints de API Principales

### **1. Listar Loterías**
```javascript
// GET /api/v1/lotteries?page=1&limit=12&status=active
const response = await axios.get('/api/v1/lotteries', {
  params: {
    page: 1,
    limit: 12,           // Máximo 100
    status: 'active'     // Opcional: filtrar por estado
  },
  headers: { Authorization: `Bearer ${token}` }
});

// Respuesta
{
  success: true,
  data: [lottery1, lottery2, ...],
  pagination: {
    page: 1,
    limit: 12,
    total: 50,
    totalPages: 5
  }
}
```

### **2. Obtener Lotería Individual**
```javascript
// GET /api/v1/lotteries/:id
const response = await axios.get(`/api/v1/lotteries/${lotteryId}`, {
  headers: { Authorization: `Bearer ${token}` }
});

// Respuesta
{
  success: true,
  data: lottery
}
```

### **3. Crear Lotería**
```javascript
// POST /api/v1/lotteries
const newLottery = {
  title: "Nueva Lotería",
  description: "Descripción de la lotería",
  is_free: false,
  ticket_price: 50,
  min_tickets: 1,
  max_tickets: 500,
  num_winners: 1,
  start_date: new Date(Date.now() + 3600000).toISOString(),  // +1 hora
  end_date: new Date(Date.now() + 86400000).toISOString(),   // +24 horas
  prize_description: "Gran premio",
  terms_conditions: "Términos y condiciones"
};

const response = await axios.post('/api/v1/lotteries', newLottery, {
  headers: { Authorization: `Bearer ${token}` }
});

// Respuesta
{
  success: true,
  message: "Lotería creada exitosamente",
  data: createdLottery
}
```

### **4. Editar Lotería**
```javascript
// PUT /api/v1/lotteries/:id
const updates = {
  title: "Título actualizado",
  description: "Nueva descripción",
  prize_description: "Premio mejorado"
};

const response = await axios.put(`/api/v1/lotteries/${lotteryId}`, updates, {
  headers: { Authorization: `Bearer ${token}` }
});

// Respuesta
{
  success: true,
  message: "Lotería actualizada exitosamente",
  data: updatedLottery
}
```

## 🎛️ Gestión de Estados

### **5. Activar Lotería**
```javascript
// PUT /api/v1/lotteries/:id
await axios.put(`/api/v1/lotteries/${lotteryId}`, {
  status: 'active'
}, {
  headers: { Authorization: `Bearer ${token}` }
});
```

### **6. Cancelar Lotería**
```javascript
// PUT /api/v1/lotteries/:id/cancel
const response = await axios.put(`/api/v1/lotteries/${lotteryId}/cancel`, {}, {
  headers: { Authorization: `Bearer ${token}` }
});

// Respuesta
{
  success: true,
  message: "Lotería cancelada exitosamente. Se procesaron 5 reembolsos.",
  data: {
    id: lotteryId,
    status: 'cancelled',
    refunded_tickets: 5
  }
}
```

### **7. Reanudar Lotería Cancelada**
```javascript
// PUT /api/v1/lotteries/:id
// Opciones: 'draft' o 'active'
await axios.put(`/api/v1/lotteries/${lotteryId}`, {
  status: 'draft'  // o 'active'
}, {
  headers: { Authorization: `Bearer ${token}` }
});
```

### **8. Eliminar Lotería**
```javascript
// DELETE /api/v1/lotteries/:id
const response = await axios.delete(`/api/v1/lotteries/${lotteryId}`, {
  headers: { Authorization: `Bearer ${token}` }
});

// Respuesta (con tickets vendidos)
{
  success: true,
  message: "Lotería eliminada exitosamente. Se eliminaron 10 tickets vendidos",
  data: {
    id: lotteryId,
    title: "Lotería eliminada",
    status: "active",
    deleted_tickets: 10,
    warning: "Se eliminaron tickets vendidos"
  }
}
```

## 📊 Endpoints de Estadísticas

### **9. Tickets Vendidos**
```javascript
// GET /api/v1/lotteries/:id/sold-tickets
const response = await axios.get(`/api/v1/lotteries/${lotteryId}/sold-tickets`);

// Respuesta
{
  success: true,
  data: {
    ticket_numbers: [1, 3, 5, 7, 12, 15],
    count: 6
  }
}
```

### **10. Tickets del Usuario**
```javascript
// GET /api/v1/lotteries/:id/my-tickets
const response = await axios.get(`/api/v1/lotteries/${lotteryId}/my-tickets`, {
  headers: { Authorization: `Bearer ${userToken}` }
});

// Respuesta
{
  success: true,
  data: [
    {
      id: 1,
      lottery_id: 5,
      user_id: 2,
      ticket_number: 7,
      payment_status: 'paid',
      payment_amount: 100.00,
      purchase_date: "2024-01-01T12:00:00.000Z"
    }
  ],
  count: 1
}
```

### **11. Estadísticas de Lotería**
```javascript
// GET /api/v1/lotteries/:id/stats
const response = await axios.get(`/api/v1/lotteries/${lotteryId}/stats`);

// Respuesta
{
  success: true,
  data: {
    total_tickets_sold: 150,
    unique_participants: 45,
    max_tickets: 1000,
    available_tickets: 850,
    total_revenue: 15000.00,
    participation_rate: "15.00"  // Porcentaje
  }
}
```

### **12. Comprar Tickets**
```javascript
// POST /api/v1/lotteries/:id/buy
const response = await axios.post(`/api/v1/lotteries/${lotteryId}/buy`, {
  ticket_numbers: [2, 4, 6, 8]
}, {
  headers: { Authorization: `Bearer ${userToken}` }
});

// Respuesta
{
  success: true,
  message: "Tickets comprados exitosamente",
  data: [ticketObjects],
  count: 4
}
```

## 🎨 Interfaz de Usuario

### **Botones Dinámicos por Estado**

#### **Estado: `draft` (Borrador)**
```html
<button onclick="editLottery(id)">✏️ Editar</button>
<button onclick="activateLottery(id)">▶️ Activar</button>
<button onclick="deleteLottery(id)">🗑️ Eliminar</button>
```

#### **Estado: `active` (Activa)**
```html
<button onclick="editLottery(id)">✏️ Editar</button>
<button onclick="cancelLottery(id)">🚫 Cancelar</button>
<button onclick="deleteLottery(id)">🗑️ Eliminar</button>
```

#### **Estado: `cancelled` (Cancelada)**
```html
<button onclick="editLottery(id)">✏️ Editar</button>
<button onclick="resumeLottery(id)">▶️ Reanudar</button>
<button onclick="deleteLottery(id)">🗑️ Eliminar</button>
```

#### **Estado: `finished` (Finalizada)**
```html
<button onclick="viewDetails(id)">👁️ Ver detalles</button>
<button onclick="deleteLottery(id)">🗑️ Eliminar</button>
```

### **Funciones JavaScript Requeridas**

#### **Crear/Editar Lotería**
```javascript
async function saveLottery() {
  const formData = getFormData();
  
  try {
    const url = currentLotteryId ? 
      `/api/v1/lotteries/${currentLotteryId}` : 
      '/api/v1/lotteries';
    
    const method = currentLotteryId ? 'PUT' : 'POST';
    
    const response = await axios({
      method,
      url,
      data: formData,
      headers: { Authorization: `Bearer ${token}` }
    });
    
    showAlert('Lotería guardada exitosamente', 'success');
    closeModal('lotteryModal');
    loadLotteries();
    
  } catch (error) {
    showAlert(error.response?.data?.message || 'Error al guardar', 'danger');
  }
}

function getFormData() {
  return {
    title: document.getElementById('title').value,
    description: document.getElementById('description').value,
    is_free: document.getElementById('is_free').value === 'true',
    ticket_price: parseFloat(document.getElementById('ticket_price').value) || 0,
    min_tickets: parseInt(document.getElementById('min_tickets').value) || 1,
    max_tickets: parseInt(document.getElementById('max_tickets').value) || 100,
    num_winners: parseInt(document.getElementById('num_winners').value) || 1,
    start_date: new Date(document.getElementById('start_date').value).toISOString(),
    end_date: new Date(document.getElementById('end_date').value).toISOString(),
    prize_description: document.getElementById('prize_description').value,
    terms_conditions: document.getElementById('terms_conditions').value
  };
}
```

#### **Editar Lotería (con Restricciones)**
```javascript
async function editLottery(lotteryId) {
  try {
    const response = await axios.get(`/api/v1/lotteries/${lotteryId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const lottery = response.data.data;
    
    // Verificar que puede editarse
    if (!['draft', 'cancelled', 'active'].includes(lottery.status)) {
      showAlert('Solo se pueden editar loterías en estado borrador, canceladas o activas', 'warning');
      return;
    }
    
    // Advertencia especial para loterías activas con tickets vendidos
    if (lottery.status === 'active' && lottery.tickets_sold > 0) {
      const proceed = confirm(`⚠️ ADVERTENCIA: Esta lotería está ACTIVA y tiene ${lottery.tickets_sold} tickets vendidos.
      
Al editarla, solo podrás modificar:
• Título y descripción
• Imagen
• Fechas de inicio y fin
• Descripción del premio
• Términos y condiciones

NO podrás cambiar:
• Precio de tickets
• Cantidad máxima/mínima de tickets
• Número de ganadores
• Si es gratis o de pago

¿Deseas continuar con la edición?`);
      
      if (!proceed) return;
    }
    
    // Llenar formulario y configurar restricciones
    populateForm(lottery);
    configureFieldRestrictions(lottery);
    
    new bootstrap.Modal(document.getElementById('lotteryModal')).show();
    
  } catch (error) {
    showAlert(error.response?.data?.message || 'Error al cargar lotería', 'danger');
  }
}

function configureFieldRestrictions(lottery) {
  const isActiveWithTickets = lottery.status === 'active' && lottery.tickets_sold > 0;
  const restrictedFields = ['is_free', 'ticket_price', 'min_tickets', 'max_tickets', 'num_winners'];
  
  restrictedFields.forEach(fieldId => {
    const element = document.getElementById(fieldId);
    if (element) {
      element.disabled = isActiveWithTickets;
      if (isActiveWithTickets) {
        element.style.backgroundColor = '#f8f9fa';
        element.style.cursor = 'not-allowed';
        element.title = 'No se puede modificar en loterías activas con tickets vendidos';
      }
    }
  });
  
  if (isActiveWithTickets) {
    document.getElementById('lotteryModalTitle').textContent = 
      `Editar Lotería Activa (${lottery.tickets_sold} tickets vendidos)`;
  }
}
```

#### **Cancelar Lotería**
```javascript
async function cancelLottery(lotteryId) {
  if (!confirm('¿Estás seguro de que quieres cancelar esta lotería? Se reembolsarán todos los tickets vendidos.')) {
    return;
  }
  
  try {
    const response = await axios.put(`/api/v1/lotteries/${lotteryId}/cancel`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    showAlert(response.data.message, 'success');
    loadLotteries();
    
  } catch (error) {
    showAlert(error.response?.data?.message || 'Error al cancelar lotería', 'danger');
  }
}
```

#### **Reanudar Lotería**
```javascript
async function resumeLottery(lotteryId) {
  try {
    const lotteryResponse = await axios.get(`/api/v1/lotteries/${lotteryId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const lottery = lotteryResponse.data.data;
    
    if (lottery.status !== 'cancelled') {
      showAlert('Solo se pueden reanudar loterías canceladas', 'warning');
      return;
    }
    
    const choice = prompt(`¿Cómo quieres reanudar la lotería "${lottery.title}"?

Opciones:
1 - Como BORRADOR (podrás editarla antes de activar)
2 - Como ACTIVA (usuarios podrán participar inmediatamente)

Escribe 1 o 2:`);
    
    if (!choice || !['1', '2'].includes(choice)) {
      showAlert('Reanudación cancelada', 'info');
      return;
    }
    
    const newStatus = choice === '1' ? 'draft' : 'active';
    const statusText = choice === '1' ? 'borrador' : 'activa';
    
    const confirmMessage = `¿Confirmas reanudar la lotería como ${statusText.toUpperCase()}?

Los tickets que fueron reembolsados NO se restaurarán automáticamente.`;
    
    if (!confirm(confirmMessage)) return;
    
    await axios.put(`/api/v1/lotteries/${lotteryId}`, {
      status: newStatus
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    showAlert(`Lotería reanudada como ${statusText} exitosamente`, 'success');
    loadLotteries();
    
  } catch (error) {
    showAlert(error.response?.data?.message || 'Error al reanudar lotería', 'danger');
  }
}
```

#### **Eliminar Lotería**
```javascript
async function deleteLottery(lotteryId) {
  try {
    // Obtener información de la lotería
    const lotteryResponse = await axios.get(`/api/v1/lotteries/${lotteryId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const lottery = lotteryResponse.data.data;
    const hasTicketsSold = lottery.tickets_sold > 0;
    
    let confirmMessage;
    if (hasTicketsSold) {
      confirmMessage = `⚠️ ADVERTENCIA: Esta lotería tiene ${lottery.tickets_sold} tickets vendidos.

Al eliminarla se perderán TODOS los datos incluyendo:
• ${lottery.tickets_sold} tickets de usuarios
• Historial de participación
• Posibles ganadores

¿Estás COMPLETAMENTE SEGURO de que quieres eliminar "${lottery.title}"?

Esta acción NO SE PUEDE DESHACER.`;
    } else {
      confirmMessage = `¿Estás seguro de que quieres eliminar la lotería "${lottery.title}"?

Esta acción no se puede deshacer.`;
    }
    
    if (!confirm(confirmMessage)) return;
    
    // Confirmación adicional para loterías con tickets
    if (hasTicketsSold) {
      const finalConfirm = prompt(
        `Para confirmar que entiendes las consecuencias, escribe: ELIMINAR

(Se eliminarán ${lottery.tickets_sold} tickets vendidos)`
      );
      
      if (finalConfirm !== 'ELIMINAR') {
        showAlert('Eliminación cancelada', 'info');
        return;
      }
    }
    
    const response = await axios.delete(`/api/v1/lotteries/${lotteryId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const deletedTickets = response.data.data.deleted_tickets || 0;
    let message = response.data.message;
    
    if (deletedTickets > 0) {
      message += ` ⚠️ Se eliminaron ${deletedTickets} tickets de usuarios.`;
    }
    
    showAlert(message, deletedTickets > 0 ? 'warning' : 'success');
    loadLotteries();
    
  } catch (error) {
    showAlert(error.response?.data?.message || 'Error al eliminar lotería', 'danger');
  }
}
```

## 🛡️ Validaciones del Frontend

### **Validaciones de Fechas**
```javascript
function validateDates() {
  const startDate = new Date(document.getElementById('start_date').value);
  const endDate = new Date(document.getElementById('end_date').value);
  const now = new Date();
  
  if (startDate <= now) {
    showAlert('La fecha de inicio debe ser futura', 'warning');
    return false;
  }
  
  if (endDate <= startDate) {
    showAlert('La fecha de fin debe ser posterior a la fecha de inicio', 'warning');
    return false;
  }
  
  return true;
}
```

### **Validaciones de Números**
```javascript
function validateNumbers() {
  const minTickets = parseInt(document.getElementById('min_tickets').value);
  const maxTickets = parseInt(document.getElementById('max_tickets').value);
  const numWinners = parseInt(document.getElementById('num_winners').value);
  const ticketPrice = parseFloat(document.getElementById('ticket_price').value);
  
  if (minTickets < 1) {
    showAlert('El mínimo de tickets debe ser al menos 1', 'warning');
    return false;
  }
  
  if (maxTickets < minTickets) {
    showAlert('El máximo de tickets debe ser mayor al mínimo', 'warning');
    return false;
  }
  
  if (numWinners > maxTickets) {
    showAlert('El número de ganadores no puede ser mayor al máximo de tickets', 'warning');
    return false;
  }
  
  if (ticketPrice < 0) {
    showAlert('El precio no puede ser negativo', 'warning');
    return false;
  }
  
  return true;
}
```

### **Validación de Estado**
```javascript
function canEditLottery(lottery) {
  const editableStates = ['draft', 'cancelled', 'active'];
  return editableStates.includes(lottery.status);
}

function getRestrictedFields(lottery) {
  if (lottery.status === 'active' && lottery.tickets_sold > 0) {
    return ['is_free', 'ticket_price', 'min_tickets', 'max_tickets', 'num_winners'];
  }
  return [];
}

function getAllowedFields(lottery) {
  const allFields = ['title', 'description', 'image_url', 'start_date', 'end_date', 
                    'prize_description', 'terms_conditions'];
  
  if (lottery.status !== 'active' || lottery.tickets_sold === 0) {
    allFields.push('is_free', 'ticket_price', 'min_tickets', 'max_tickets', 'num_winners');
  }
  
  return allFields;
}
```

## 🎨 Utilidades de UI

### **Formateo de Fechas**
```javascript
function formatDateTimeLocal(date) {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function formatDisplayDate(dateString) {
  return new Date(dateString).toLocaleString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}
```

### **Manejo de Modales**
```javascript
function closeModal(modalId) {
  const modal = bootstrap.Modal.getInstance(document.getElementById(modalId));
  if (modal) {
    modal.hide();
  }
  
  // Limpiar backdrops manualmente
  document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.remove();
  });
  
  // Restaurar scroll del body
  document.body.classList.remove('modal-open');
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
}

function forceCloseAllModals() {
  document.querySelectorAll('.modal').forEach(modal => {
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
  });
  
  document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.remove();
  });
  
  document.body.classList.remove('modal-open');
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
}
```

### **Alertas y Notificaciones**
```javascript
function showAlert(message, type = 'info') {
  const alertClass = {
    success: 'alert-success',
    danger: 'alert-danger',
    warning: 'alert-warning',
    info: 'alert-info'
  }[type] || 'alert-info';
  
  const alertHTML = `
    <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
  `;
  
  const container = document.getElementById('alerts-container') || document.body;
  container.insertAdjacentHTML('afterbegin', alertHTML);
  
  // Auto-remover después de 5 segundos
  setTimeout(() => {
    const alert = container.querySelector('.alert');
    if (alert) alert.remove();
  }, 5000);
}
```

## 🔄 Casos de Uso Completos

### **Flujo de Creación**
1. Click en "Nueva Lotería"
2. Llenar formulario
3. Validar fechas y números
4. `POST /api/v1/lotteries`
5. Mostrar en lista como `draft`

### **Flujo de Activación**
1. Click en "Activar" en lotería `draft`
2. `PUT /api/v1/lotteries/:id` con `status: 'active'`
3. Actualizar botones mostrados

### **Flujo de Edición con Restricciones**
1. Click en "Editar" en lotería `active`
2. Verificar si tiene tickets vendidos
3. Mostrar advertencia si los tiene
4. Deshabilitar campos restringidos
5. `PUT /api/v1/lotteries/:id` con campos permitidos

### **Flujo de Cancelación y Reanudación**
1. Click en "Cancelar" en lotería `active`
2. `PUT /api/v1/lotteries/:id/cancel`
3. Click en "Reanudar" en lotería `cancelled`
4. Elegir estado destino (draft/active)
5. `PUT /api/v1/lotteries/:id` con nuevo estado

### **Flujo de Eliminación Segura**
1. Click en "Eliminar"
2. Verificar si tiene tickets vendidos
3. Mostrar confirmación apropiada
4. Confirmación adicional si hay tickets
5. `DELETE /api/v1/lotteries/:id`

## 🎯 Configuración Base Requerida

### **HTML Base**
```html
<!DOCTYPE html>
<html>
<head>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
</head>
<body>
  <div id="alerts-container"></div>
  <!-- Contenido de la página -->
  
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
</body>
</html>
```

### **Variables Globales**
```javascript
const API_BASE = '/api/v1/lotteries';
let currentLotteryId = null;
let currentPage = 1;
let token = localStorage.getItem('token');
```

---

## ✅ Funcionalidades Implementadas

- ✅ **CRUD completo** de loterías
- ✅ **Gestión de estados** (draft → active → cancelled → reanudar)
- ✅ **Edición inteligente** con restricciones por estado
- ✅ **Eliminación segura** con confirmaciones dobles
- ✅ **Validaciones completas** frontend y backend
- ✅ **Interfaz responsive** con Bootstrap
- ✅ **Autenticación JWT** con roles
- ✅ **Manejo de errores** robusto
- ✅ **Estadísticas en tiempo real**
- ✅ **Sistema de tickets** completo

**¡Sistema de loterías completo y listo para producción!** 🎰✨
