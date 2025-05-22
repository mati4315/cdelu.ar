(function(window) {
    // Configuración de entorno para el frontend
    window.__env = window.__env || {};
    // URL base de la API: usa el origen actual
    window.__env.API_BASE_URL = window.location.origin;
})(this); 