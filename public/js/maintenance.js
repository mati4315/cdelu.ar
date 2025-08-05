// === ADMIN MAINTENANCE FUNCTIONS ===

// Función para mostrar notificaciones (si no está definida)
if (typeof showNotification === 'undefined') {
    function showNotification(message, type = 'success') {
        // Crear elemento de notificación
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        // Agregar al body
        document.body.appendChild(notification);
        
        // Auto-remover después de 5 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }
}

function purgeCache() {
    if (confirm('¿Estás seguro de que quieres purgar la caché del sistema? Esto puede afectar temporalmente el rendimiento.')) {
        const token = localStorage.getItem('authToken');
        showNotification('Purgando caché...', 'info');
        
        fetch('/api/v1/admin/purge-cache', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({})
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('Caché purgada exitosamente', 'success');
            } else {
                showNotification(data.message || 'Error al purgar caché', 'error');
            }
        })
        .catch(error => {
            console.error('Error purging cache:', error);
            showNotification('Error al purgar la caché', 'error');
        });
    }
}

function showMaintenanceModal() {
    document.getElementById('maintenanceModal').style.display = 'flex';
}

function closeMaintenanceModal() {
    document.getElementById('maintenanceModal').style.display = 'none';
}

function checkDatabaseStatus() {
    const token = localStorage.getItem('authToken');
    showNotification('Verificando estado de la base de datos...', 'info');
    
    fetch('/api/v1/admin/database/status', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification(`Estado BD: ${data.data.status}`, 'success');
        } else {
            showNotification(data.message || 'Error al verificar BD', 'error');
        }
    })
    .catch(error => {
        console.error('Error checking database:', error);
        showNotification('Error al verificar la base de datos', 'error');
    });
}

function optimizeDatabase() {
    if (confirm('¿Estás seguro de que quieres optimizar la base de datos? Esto puede tomar varios minutos.')) {
        const token = localStorage.getItem('authToken');
        showNotification('Optimizando base de datos...', 'info');
        
        fetch('/api/v1/admin/database/optimize', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({})
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('Base de datos optimizada exitosamente', 'success');
            } else {
                showNotification(data.message || 'Error al optimizar BD', 'error');
            }
        })
        .catch(error => {
            console.error('Error optimizing database:', error);
            showNotification('Error al optimizar la base de datos', 'error');
        });
    }
}

function backupDatabase() {
    if (confirm('¿Estás seguro de que quieres crear un backup de la base de datos?')) {
        const token = localStorage.getItem('authToken');
        showNotification('Creando backup de la base de datos...', 'info');
        
        fetch('/api/v1/admin/database/backup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({})
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('Backup creado exitosamente', 'success');
            } else {
                showNotification(data.message || 'Error al crear backup', 'error');
            }
        })
        .catch(error => {
            console.error('Error creating backup:', error);
            showNotification('Error al crear el backup', 'error');
        });
    }
}

function checkSystemStatus() {
    const token = localStorage.getItem('authToken');
    showNotification('Verificando estado del sistema...', 'info');
    
    fetch('/api/v1/admin/system/status', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification(`Estado del sistema: ${data.data.status}`, 'success');
        } else {
            showNotification(data.message || 'Error al verificar sistema', 'error');
        }
    })
    .catch(error => {
        console.error('Error checking system:', error);
        showNotification('Error al verificar el sistema', 'error');
    });
}

function clearLogs() {
    if (confirm('¿Estás seguro de que quieres limpiar los logs del sistema?')) {
        const token = localStorage.getItem('authToken');
        showNotification('Limpiando logs...', 'info');
        
        fetch('/api/v1/admin/system/clear-logs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({})
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('Logs limpiados exitosamente', 'success');
            } else {
                showNotification(data.message || 'Error al limpiar logs', 'error');
            }
        })
        .catch(error => {
            console.error('Error clearing logs:', error);
            showNotification('Error al limpiar los logs', 'error');
        });
    }
}

function restartServices() {
    if (confirm('¿Estás seguro de que quieres reiniciar los servicios del sistema? Esto puede causar una breve interrupción.')) {
        const token = localStorage.getItem('authToken');
        showNotification('Reiniciando servicios...', 'info');
        
        fetch('/api/v1/admin/system/restart', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({})
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('Servicios reiniciados exitosamente', 'success');
            } else {
                showNotification(data.message || 'Error al reiniciar servicios', 'error');
            }
        })
        .catch(error => {
            console.error('Error restarting services:', error);
            showNotification('Error al reiniciar los servicios', 'error');
        });
    }
}

function checkSecurityStatus() {
    const token = localStorage.getItem('authToken');
    showNotification('Verificando estado de seguridad...', 'info');
    
    fetch('/api/v1/admin/security/status', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification(`Estado de seguridad: ${data.data.status}`, 'success');
        } else {
            showNotification(data.message || 'Error al verificar seguridad', 'error');
        }
    })
    .catch(error => {
        console.error('Error checking security:', error);
        showNotification('Error al verificar la seguridad', 'error');
    });
}

function updateSecurityKeys() {
    if (confirm('¿Estás seguro de que quieres actualizar las claves de seguridad? Esto puede afectar las sesiones activas.')) {
        const token = localStorage.getItem('authToken');
        showNotification('Actualizando claves de seguridad...', 'info');
        
        fetch('/api/v1/admin/security/update-keys', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({})
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('Claves de seguridad actualizadas', 'success');
            } else {
                showNotification(data.message || 'Error al actualizar claves', 'error');
            }
        })
        .catch(error => {
            console.error('Error updating security keys:', error);
            showNotification('Error al actualizar las claves de seguridad', 'error');
        });
    }
}

function checkRateLimits() {
    const token = localStorage.getItem('authToken');
    showNotification('Verificando límites de tasa...', 'info');
    
    fetch('/api/v1/admin/security/rate-limits', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification(`Límites de tasa: ${data.data.status}`, 'success');
        } else {
            showNotification(data.message || 'Error al verificar límites', 'error');
        }
    })
    .catch(error => {
        console.error('Error checking rate limits:', error);
        showNotification('Error al verificar los límites de tasa', 'error');
    });
}

function blockSuspiciousIPs() {
    if (confirm('¿Estás seguro de que quieres bloquear las IPs sospechosas?')) {
        const token = localStorage.getItem('authToken');
        showNotification('Bloqueando IPs sospechosas...', 'info');
        
        fetch('/api/v1/admin/security/block-ips', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({})
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('IPs bloqueadas exitosamente', 'success');
            } else {
                showNotification(data.message || 'Error al bloquear IPs', 'error');
            }
        })
        .catch(error => {
            console.error('Error blocking IPs:', error);
            showNotification('Error al bloquear las IPs', 'error');
        });
    }
} 