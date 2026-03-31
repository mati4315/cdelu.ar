(function(window) {
    // Configuración de entorno para el frontend
    window.__env = window.__env || {};
    
    // Detectar si estamos en producción o desarrollo
    const isProduction = window.location.hostname === 'cdelu.ar' || 
                        window.location.hostname === 'www.cdelu.ar';
    
    // URL base de la API
    if (isProduction) {
        window.__env.API_BASE_URL = 'https://api.cdelu.ar/api/v1';
    } else {
        window.__env.API_BASE_URL = window.location.origin + '/api/v1';
    }
})(this); 