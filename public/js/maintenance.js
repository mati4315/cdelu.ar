// === ADMIN MAINTENANCE FUNCTIONS ===
// Refactored to integrate deeply with the new DashboardApp singleton

function apiAction(endpoint, method = 'GET', successMsg, errorMsg) {
    if (method === 'POST') {
        DashboardApp.showNotification('Procesando solicitud...', 'info');
        console.log(`[Maintenance] Iniciando acción segura (POST) en el endpoint: ${endpoint}`);
    } else {
        console.log(`[Maintenance] Solicitando información (GET) al endpoint: ${endpoint}`);
    }
    
    DashboardApp.apiFetch(endpoint, { method })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            let msg = successMsg;
            // Si el backend devuelve status explícito, concatenarlo
            if (data.data && data.data.status) {
                msg = `${successMsg}: ${data.data.status}`;
            }
            console.log(`[Maintenance] ÉXITO en ${endpoint}. Respuesta del servidor:`, data);
            DashboardApp.showNotification(msg, 'success');
        } else {
            console.error(`[Maintenance] ERROR API en ${endpoint}. Mensaje:`, data.message || errorMsg);
            DashboardApp.showNotification(data.message || errorMsg, 'error');
        }
    })
    .catch(error => {
        console.error(`[Maintenance] EXCEPCIÓN en ${endpoint}:`, error);
        DashboardApp.showNotification(errorMsg, 'error');
    });
}

// 1. Base de Datos
window.checkDatabaseStatus = function() {
    DashboardApp.showNotification('Verificando estado de la base de datos...', 'info');
    apiAction('/admin/database/status', 'GET', 'Estado BD', 'Error al verificar la base de datos');
};

window.optimizeDatabase = function() {
    if (confirm('¿Estás seguro de que quieres optimizar la base de datos? Esto puede tomar varios minutos.')) {
        apiAction('/admin/database/optimize', 'POST', 'Base de datos optimizada exitosamente', 'Error al optimizar la base de datos');
    }
};

window.backupDatabase = function() {
    if (confirm('¿Estás seguro de que quieres crear un backup de la base de datos?')) {
        apiAction('/admin/database/backup', 'POST', 'Backup creado exitosamente', 'Error al crear el backup');
    }
};

// 2. Sistema y Caché
window.checkSystemStatus = function() {
    DashboardApp.showNotification('Verificando estado del sistema...', 'info');
    apiAction('/admin/system/status', 'GET', 'Estado de servidor', 'Error al verificar el estado del sistema');
};

window.clearLogs = function() {
    if (confirm('¿Estás seguro de que quieres limpiar los logs del sistema?')) {
        apiAction('/admin/system/clear-logs', 'POST', 'Logs limpiados exitosamente', 'Error al limpiar los logs');
    }
};

window.purgeCache = function() {
    if (confirm('¿Estás seguro de que quieres purgar la caché del sistema? Esto puede afectar temporalmente el rendimiento.')) {
        apiAction('/admin/purge-cache', 'POST', 'Caché purgada exitosamente', 'Error al purgar la caché');
    }
};

window.restartServices = function() {
    if (confirm('¡PELIGRO! ¿Estás seguro de que quieres reiniciar los servicios? El dashboard no estará disponible por unos segundos.')) {
        apiAction('/admin/system/restart', 'POST', 'Servicios reiniciados exitosamente', 'Error al reiniciar los servicios');
    }
};

// 3. Seguridad
window.checkSecurityStatus = function() {
    DashboardApp.showNotification('Verificando estado de seguridad...', 'info');
    apiAction('/admin/security/status', 'GET', 'Estado Seguridad', 'Error al verificar el estado de seguridad');
};

window.checkRateLimits = function() {
    DashboardApp.showNotification('Verificando límites de tasa...', 'info');
    apiAction('/admin/security/rate-limits', 'GET', 'Límites de Tasa', 'Error al verificar los límites de tasa');
};

window.updateSecurityKeys = function() {
    if (confirm('¿Estás seguro de que quieres rotar las llaves de seguridad? Todos los usuarios deberán iniciar sesión nuevamente.')) {
        apiAction('/admin/security/update-keys', 'POST', 'Claves de seguridad actualizadas', 'Error al rotar claves');
    }
};

window.blockSuspiciousIPs = function() {
    if (confirm('¿Estás seguro de que quieres bloquear proactivamente IPs sospechosas?')) {
        apiAction('/admin/security/block-ips', 'POST', 'IPs sospechosas bloqueadas', 'Error al bloquear IPs');
    }
};