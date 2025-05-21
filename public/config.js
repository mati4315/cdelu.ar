(function(window) {
    // Configuración de entorno para el frontend
    window.__env = window.__env || {};
    // URL base de la API: usa el origen actual para no codificarla en duro
    window.__env.API_BASE_URL = window.location.origin + '/api/v1';
})(this); 