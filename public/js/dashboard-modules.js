/**
 * dashboard-modules.js
 * Admin panel for enabling/disabling site modules
 */

const DashboardModules = {
    modules: [],

    async load() {
        this.cacheDOM();
        await this.fetchModules();
    },

    cacheDOM() {
        this.container = document.getElementById('modulesContainer');
        this.loader = document.getElementById('modulesLoader');
    },

    async fetchModules() {
        if (this.loader) this.loader.style.display = 'block';
        if (this.container) this.container.style.display = 'none';

        try {
            const res = await DashboardApp.apiFetch('/admin/modules');
            const data = await res.json();

            if (res.ok && data.success) {
                this.modules = data.data;
                this.render(this.modules);
            } else {
                DashboardApp.showNotification(data.message || 'Error cargando módulos', 'error');
            }
        } catch (error) {
            console.error('Error fetching modules:', error);
            DashboardApp.showNotification('Error de conexión', 'error');
        } finally {
            if (this.loader) this.loader.style.display = 'none';
            if (this.container) this.container.style.display = 'block';
        }
    },

    getModuleIcon(name) {
        const icons = {
            ads:       'bi-badge-ad-fill',
            lotteries: 'bi-ticket-perforated-fill',
            surveys:   'bi-bar-chart-fill',
            facebook:  'bi-facebook',
            community: 'bi-chat-dots-fill'
        };
        return icons[name] || 'bi-puzzle-fill';
    },

    getModuleColor(name) {
        const colors = {
            ads:       '#6366f1',
            lotteries: '#f59e0b',
            surveys:   '#10b981',
            facebook:  '#1877F2',
            community: '#3b82f6'
        };
        return colors[name] || '#6b7280';
    },

    render(modules) {
        if (!this.container) return;

        const html = modules.map(mod => {
            const icon = this.getModuleIcon(mod.module_name);
            const color = this.getModuleColor(mod.module_name);
            const isEnabled = Boolean(mod.enabled);

            return `
                <div class="col-12 col-md-6 col-xl-4">
                    <div class="card border-0 shadow-sm h-100" style="border-radius: 1rem; border-left: 4px solid ${color} !important;">
                        <div class="card-body p-4">
                            <div class="d-flex align-items-start justify-content-between mb-3">
                                <div class="d-flex align-items-center gap-3">
                                    <div class="rounded-circle d-flex align-items-center justify-content-center" 
                                         style="width: 48px; height: 48px; background: ${color}22;">
                                        <i class="bi ${icon} fs-4" style="color: ${color};"></i>
                                    </div>
                                    <div>
                                        <div class="fw-bold fs-6">${mod.display_name}</div>
                                        <small class="text-muted">${mod.description || ''}</small>
                                    </div>
                                </div>
                                <div class="form-check form-switch ms-2 mt-1">
                                    <input class="form-check-input module-toggle" 
                                           type="checkbox" 
                                           role="switch"
                                           id="toggle_${mod.module_name}"
                                           data-module="${mod.module_name}"
                                           data-display="${mod.display_name}"
                                           ${isEnabled ? 'checked' : ''}
                                           style="width: 2.5em; height: 1.3em; cursor: pointer;">
                                </div>
                            </div>
                            <div class="d-flex align-items-center gap-2 mt-2">
                                <span class="badge ${isEnabled ? 'bg-success' : 'bg-secondary'} bg-opacity-10 ${isEnabled ? 'text-success' : 'text-secondary'} px-2 py-1" 
                                      id="badge_${mod.module_name}">
                                    <i class="bi ${isEnabled ? 'bi-check-circle-fill' : 'bi-x-circle-fill'} me-1"></i>
                                    ${isEnabled ? 'Activo' : 'Desactivado'}
                                </span>
                                <small class="text-muted">Actualizado: ${new Date(mod.updated_at).toLocaleDateString()}</small>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        this.container.innerHTML = `<div class="row g-4">${html}</div>`;

        // Bind toggle events after rendering
        document.querySelectorAll('.module-toggle').forEach(toggle => {
            toggle.addEventListener('change', (e) => {
                this.toggleModule(e.target.dataset.module, e.target.dataset.display, e.target.checked, e.target);
            });
        });
    },

    async toggleModule(name, displayName, enabled, toggleEl) {
        // Optimistic UI: update badge immediately
        const badge = document.getElementById(`badge_${name}`);
        if (badge) {
            badge.className = `badge ${enabled ? 'bg-success' : 'bg-secondary'} bg-opacity-10 ${enabled ? 'text-success' : 'text-secondary'} px-2 py-1`;
            badge.innerHTML = `<i class="bi ${enabled ? 'bi-check-circle-fill' : 'bi-x-circle-fill'} me-1"></i>${enabled ? 'Activo' : 'Desactivado'}`;
        }

        try {
            const res = await DashboardApp.apiFetch(`/admin/modules/${name}`, {
                method: 'PUT',
                body: JSON.stringify({ enabled })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                DashboardApp.showNotification(
                    `${displayName} ${enabled ? 'activado ✅' : 'desactivado ⏸️'}`,
                    'success'
                );
            } else {
                // Rollback on failure
                if (toggleEl) toggleEl.checked = !enabled;
                if (badge) {
                    badge.className = `badge ${!enabled ? 'bg-success' : 'bg-secondary'} bg-opacity-10 ${!enabled ? 'text-success' : 'text-secondary'} px-2 py-1`;
                    badge.innerHTML = `<i class="bi ${!enabled ? 'bi-check-circle-fill' : 'bi-x-circle-fill'} me-1"></i>${!enabled ? 'Activo' : 'Desactivado'}`;
                }
                DashboardApp.showNotification(data.message || 'Error al actualizar módulo', 'error');
            }
        } catch (error) {
            // Rollback
            if (toggleEl) toggleEl.checked = !enabled;
            DashboardApp.showNotification('Error de conexión', 'error');
        }
    }
};

window.DashboardModules = DashboardModules;
