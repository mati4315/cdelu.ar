/**
 * dashboard-api-docs.js
 * Controller for the interactive API Viewer in the dashboard.
 */

const DashboardApiDocs = {
    _eventsBound: false,

    async load() {
        this.cacheDOM();
        this.bindEvents();
        
        // Auto-fill token if available on first load
        if (!this.apiTokenInput?.value) {
            this.handleRefresh();
        }
    },

    cacheDOM() {
        this.apiTokenInput = document.getElementById('apiToken');
        this.refreshApiTokenBtn = document.getElementById('refreshApiToken');
        this.apiMethodSelect = document.getElementById('apiMethod');
        this.apiEndpointSelect = document.getElementById('apiEndpointSelect');
        this.apiCustomEndpoint = document.getElementById('apiCustomEndpoint');
        this.apiBodyContainer = document.getElementById('apiBodyContainer');
        this.sendApiRequestBtn = document.getElementById('sendApiRequest');
        this.apiResponseOutput = document.getElementById('apiResponseOutput');
        this.apiResponseStatus = document.getElementById('apiResponseStatus');
        this.apiRequestBody = document.getElementById('apiRequestBody');
    },

    bindEvents() {
        if (this._eventsBound) return;

        this.refreshApiTokenBtn?.addEventListener('click', () => this.handleRefresh());
        this.apiMethodSelect?.addEventListener('change', (e) => this.handleMethodChange(e.target.value));
        this.apiEndpointSelect?.addEventListener('change', (e) => this.handleEndpointChange(e.target.value));
        this.sendApiRequestBtn?.addEventListener('click', () => this.executeRequest());

        this._eventsBound = true;
    },

    handleRefresh() {
        const token = typeof AppConfig !== 'undefined' ? localStorage.getItem(AppConfig.TOKEN_KEY) : localStorage.getItem('authToken');
        if (token && this.apiTokenInput) {
            this.apiTokenInput.value = token;
        } else {
            DashboardApp.showNotification('No se encontró un token de sesión activo', 'warning');
        }
    },

    handleMethodChange(method) {
        if (method === 'GET' || method === 'DELETE') {
            this.apiBodyContainer?.classList.add('d-none');
        } else {
            this.apiBodyContainer?.classList.remove('d-none');
        }
    },

    handleEndpointChange(selection) {
        if (selection === 'custom') {
            this.apiCustomEndpoint?.classList.remove('d-none');
        } else {
            this.apiCustomEndpoint?.classList.add('d-none');
        }
    },

    async executeRequest() {
        const method = this.apiMethodSelect?.value;
        const selection = this.apiEndpointSelect?.value;
        const finalEndpoint = selection === 'custom' ? this.apiCustomEndpoint?.value : selection;
        const token = this.apiTokenInput?.value;
        const bodyText = this.apiRequestBody?.value;

        if (!finalEndpoint) {
            DashboardApp.showNotification('Por favor ingresa un endpoint válido', 'warning');
            return;
        }

        if (this.apiResponseOutput) this.apiResponseOutput.textContent = 'Enviando petición a ' + finalEndpoint + '...';
        if (this.apiResponseStatus) {
            this.apiResponseStatus.textContent = 'Cargando...';
            this.apiResponseStatus.className = 'badge bg-info p-2';
        }
        
        try {
            const options = {
                method,
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            };

            if (method !== 'GET' && method !== 'DELETE') {
                options.headers['Content-Type'] = 'application/json';
                try {
                    JSON.parse(bodyText); // validation check
                    options.body = bodyText;
                } catch (jsonErr) {
                    throw new Error('El cuerpo de la petición no es un JSON válido');
                }
            }

            // Using raw fetch instead of DashboardApp.apiFetch to show full raw response lifecycle in GUI
            const response = await fetch(finalEndpoint, options);
            
            if (this.apiResponseStatus) {
                this.apiResponseStatus.textContent = `${response.status} ${response.statusText}`;
                this.apiResponseStatus.className = `badge p-2 ${response.ok ? 'bg-success' : 'bg-danger'}`;
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const data = await response.json().catch(() => null);
                if (this.apiResponseOutput) {
                    this.apiResponseOutput.textContent = data ? JSON.stringify(data, null, 2) : 'La respuesta no es un JSON o está vacía.';
                }
            } else {
                const textData = await response.text();
                if (this.apiResponseOutput) {
                    this.apiResponseOutput.textContent = textData || 'Respuesta vacía';
                }
            }
            
            if (response.ok) {
                DashboardApp.showNotification('Petición completada', 'success');
            } else {
                DashboardApp.showNotification('La API devolvió un error: ' + response.status, 'error');
            }
        } catch (error) {
            if (this.apiResponseOutput) this.apiResponseOutput.textContent = `Error: ${error.message}`;
            if (this.apiResponseStatus) {
                this.apiResponseStatus.textContent = 'Error de Ejecución';
                this.apiResponseStatus.className = 'badge p-2 bg-danger';
            }
            DashboardApp.showNotification('Falló la conexión o la sintaxis', 'error');
        }
    }
};

window.DashboardApiDocs = DashboardApiDocs;
