/**
 * dashboard-app.js
 * Core logic for the Dashboard: Authentication, Tab Navigation, Modals, and Theming.
 */

const AppConfig = {
    API_BASE: '/api/v1',
    TOKEN_KEY: 'authToken',
    USER_KEY: 'userData',
    THEME_KEY: 'theme'
};

const DashboardApp = {
    init() {
        this.cacheDOM();
        this.initTheme();
        this.bindEvents();
        this.checkAuth();
    },

    cacheDOM() {
        // Theme & Layout
        this.html = document.documentElement;
        this.themeToggle = document.getElementById('themeToggle');
        this.sidebar = document.getElementById('sidebar');
        this.mobileMenuBtn = document.getElementById('mobileMenuBtn');
        this.mobileOverlay = document.getElementById('mobileOverlay');
        
        // Navigation
        this.navLinks = document.querySelectorAll('[data-tab]');
        this.pageTitle = document.getElementById('pageTitle');
        this.tabContents = document.querySelectorAll('.tab-content');
        
        // Auth / Modals
        this.loginModal = document.getElementById('loginModal');
        this.loginForm = document.getElementById('loginForm');
        this.logoutBtn = document.getElementById('logoutBtn');
        this.notification = document.getElementById('notification');
    },

    initTheme() {
        if (!this.themeToggle) return;
        const savedTheme = localStorage.getItem(AppConfig.THEME_KEY) || 'dark';
        this.html.setAttribute('data-theme', savedTheme);
        this.themeToggle.checked = savedTheme === 'light';
        
        this.themeToggle.addEventListener('change', () => {
            const newTheme = this.themeToggle.checked ? 'light' : 'dark';
            this.html.setAttribute('data-theme', newTheme);
            localStorage.setItem(AppConfig.THEME_KEY, newTheme);
        });
    },

    bindEvents() {
        // Mobile sidebar toggle
        if (this.mobileMenuBtn) {
            this.mobileMenuBtn.addEventListener('click', () => {
                this.sidebar.classList.toggle('open');
                this.mobileOverlay.classList.toggle('show');
            });
        }
        if (this.mobileOverlay) {
            this.mobileOverlay.addEventListener('click', () => {
                this.sidebar.classList.remove('open');
                this.mobileOverlay.classList.remove('show');
            });
        }

        // Tab Navigation Navigation
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const tab = link.dataset.tab;
                if(tab) {
                    window.location.hash = tab;
                }
            });
        });

        window.addEventListener('hashchange', () => this.handleHashNavigation());

        // Auth Events
        if (this.loginForm) {
            this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        if (this.logoutBtn) {
            this.logoutBtn.addEventListener('click', () => this.logout());
        }
    },

    handleHashNavigation() {
        let hash = window.location.hash.substring(1);
        if (!hash) hash = 'dashboard';

        // Update Nav Menu active states
        this.navLinks.forEach(link => {
            if (link.dataset.tab === hash) {
                link.classList.add('active');
                if (this.pageTitle) this.pageTitle.textContent = link.textContent.trim();
            } else {
                link.classList.remove('active');
            }
        });

        // Close sidebar on mobile
        if(this.sidebar) this.sidebar.classList.remove('open');
        if(this.mobileOverlay) this.mobileOverlay.classList.remove('show');

        // Show Content
        this.tabContents.forEach(content => {
            content.classList.remove('active');
        });

        const targetTab = document.getElementById(`${hash}-content`);
        if (targetTab) {
            targetTab.classList.add('active');
        }

        // Trigger module specific loads based on tab
        if(hash === 'dashboard' && window.DashboardStats) DashboardStats.load();
        if(hash === 'news' && window.DashboardNews) DashboardNews.load();
        if(hash === 'lotteries' && window.DashboardLotteries) DashboardLotteries.load();
        if(hash === 'users' && window.DashboardUsers) DashboardUsers.load();
        if(hash === 'api-docs' && window.DashboardApiDocs) DashboardApiDocs.load();
        if(hash === 'ads' && window.DashboardAds) DashboardAds.load();
        if(hash === 'com' && window.DashboardCom) DashboardCom.load();
        if(hash === 'comments' && window.DashboardComments) DashboardComments.load();
        if(hash === 'modules' && window.DashboardModules) DashboardModules.load();
    },

    async checkAuth() {
        const token = localStorage.getItem(AppConfig.TOKEN_KEY);
        if (!token) {
            this.showLogin();
            return;
        }
        
        try {
            // Validate token visually via a standard stats endpoint
            const res = await fetch(`${AppConfig.API_BASE}/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.status === 401) {
                this.logout('Sesión expirada. Por favor inicie sesión nuevamente.');
            } else {
                // Initial route trigger
                this.handleHashNavigation();
            }
        } catch (error) {
            console.error('Auth verification error', error);
        }
    },

    showLogin() {
        if(this.loginModal) {
            this.loginModal.style.display = 'flex';
            setTimeout(() => this.loginModal.classList.add('show'), 10);
        }
    },

    hideLogin() {
        if(this.loginModal) {
            this.loginModal.classList.remove('show');
            setTimeout(() => this.loginModal.style.display = 'none', 400);
        }
    },

    async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const btnText = document.querySelector('.login-text');
        const spinner = document.querySelector('.login-form .loader-spinner');
        
        if (btnText) btnText.classList.add('d-none');
        if (spinner) spinner.classList.remove('d-none');

        try {
            const res = await fetch(`${AppConfig.API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();

            if (res.ok && data.token) {
                localStorage.setItem(AppConfig.TOKEN_KEY, data.token);
                localStorage.setItem(AppConfig.USER_KEY, JSON.stringify(data.user));
                this.hideLogin();
                this.showNotification('¡Bienvenido al dashboard!', 'success');
                this.handleHashNavigation();
            } else {
                this.showNotification(data.error || 'Error al iniciar sesión', 'error');
            }
        } catch (error) {
            this.showNotification('Error de conexión', 'error');
        } finally {
            if (btnText) btnText.classList.remove('d-none');
            if (spinner) spinner.classList.add('d-none');
        }
    },

    logout(msg = 'Sesión cerrada correctamente') {
        localStorage.removeItem(AppConfig.TOKEN_KEY);
        localStorage.removeItem(AppConfig.USER_KEY);
        this.showLogin();
        this.showNotification(msg, 'info');
    },

    showNotification(message, type = 'info') {
        if(!this.notification) return;
        this.notification.className = `app-notification ${type}`;
        this.notification.innerHTML = `
            <i class="bi ${type === 'success' ? 'bi-check-circle' : type === 'error' ? 'bi-x-octagon' : 'bi-info-circle'}"></i>
            <span>${message}</span>
        `;
        
        // Reflow for transition
        void this.notification.offsetWidth;
        this.notification.classList.add('show');
        
        setTimeout(() => {
            this.notification.classList.remove('show');
        }, 4000);
    },

    apiFetch: async function(endpoint, options = {}) {
        const token = localStorage.getItem(AppConfig.TOKEN_KEY);
        const method = options.method ? options.method.toUpperCase() : 'GET';
        
        const headers = {
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...(options.headers || {})
        };

        // Only add Content-Type for requests that send json bodies (POST, PUT, PATCH) or if explicitly overriding
        if (!headers['Content-Type'] && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && options.body) {
            headers['Content-Type'] = 'application/json';
        }

        const config = { ...options, headers };
        
        // Fastify backend fix: Always ensure POST/PUT has a body if JSON is specified
        if ((config.method === 'POST' || config.method === 'PUT' || config.method === 'DELETE') && !config.body && headers['Content-Type'] === 'application/json') {
            config.body = JSON.stringify({});
        }

        const res = await fetch(`${AppConfig.API_BASE}${endpoint}`, config);
        
        if (res.status === 401) {
            this.logout('Sesión expirada.');
            throw new Error('Unauthorized');
        }
        
        return res;
    }
};

document.addEventListener('DOMContentLoaded', () => DashboardApp.init());
window.DashboardApp = DashboardApp;
