/**
 * dashboard-ads.js
 * Manages fetching, CRUD operations, and rendering for the Ads (Publicidad) tab.
 */

const DashboardAds = {
    currentPage: 1,
    currentLimit: 10,
    totalPages: 0,
    totalItems: 0,
    filters: {
        categoria: '',
        activo: '',
        sort: 'created_at'
    },
    editingAdId: null,

    async load() {
        this.cacheDOM();
        this.bindEvents();
        await this.loadStats();
        await this.fetchAds();
    },

    cacheDOM() {
        this.statTotal = document.getElementById('adStatTotal');
        this.statImpressions = document.getElementById('adStatImpressions');
        this.statClicks = document.getElementById('adStatClicks');
        this.statCtr = document.getElementById('adStatCtr');

        this.filterCategory = document.getElementById('adsFilterCategory');
        this.filterStatus = document.getElementById('adsFilterStatus');
        this.filterSort = document.getElementById('adsFilterSort');

        this.adsTable = document.getElementById('adsTable');
        this.adsContainer = document.getElementById('adsListContainer');
        this.loader = document.getElementById('adsLoader');
        this.emptyState = document.getElementById('adsEmptyState');
        this.paginationContainer = document.getElementById('adsPaginationContainer');

        this.adModal = document.getElementById('adModal');
        this.adForm = document.getElementById('adForm');
        this.adModalTitle = document.getElementById('adModalTitle');
    },

    bindEvents() {
        if (this._eventsBound) return;
        
        if (this.adForm) {
            this.adForm.addEventListener('submit', (e) => this.handleSaveAd(e));
        }

        this._eventsBound = true;
    },

    showToast(message, type = 'success') {
        const toastEl = document.getElementById('globalToast');
        const toastMsg = document.getElementById('globalToastMessage');
        if (!toastEl || !toastMsg) return;

        toastMsg.innerHTML = `<i class="bi bg-transparent ${type === 'success' ? 'bi-check-circle-fill text-success' : 'bi-exclamation-triangle-fill text-danger'} me-2"></i> ${message}`;
        
        if (window.bootstrap) {
            const toast = new bootstrap.Toast(toastEl, { autohide: true, delay: 4000 });
            toast.show();
        }
    },

    async loadStats() {
        try {
            const res = await DashboardApp.apiFetch('/ads/stats');
            const data = await res.json();
            const stats = data.data || {};
            
            if(this.statTotal) this.statTotal.textContent = stats.total_ads || 0;
            if(this.statImpressions) this.statImpressions.textContent = (stats.total_impresiones || 0).toLocaleString();
            if(this.statClicks) this.statClicks.textContent = (stats.total_clics || 0).toLocaleString();
            
            if(this.statCtr) {
                const imps = stats.total_impresiones || 0;
                const clicks = stats.total_clics || 0;
                const ctr = imps > 0 ? ((clicks / imps) * 100).toFixed(2) : '0.00';
                this.statCtr.textContent = ctr + '%';
            }
        } catch (error) {
            console.error('Error cargando estadísticas de anuncios:', error);
        }
    },

    applyFilters() {
        this.cacheDOM(); // Ensure filters are cached
        if(this.filterCategory) this.filters.categoria = this.filterCategory.value;
        if(this.filterStatus) this.filters.activo = this.filterStatus.value;
        if(this.filterSort) this.filters.sort = this.filterSort.value;
        this.currentPage = 1;
        this.fetchAds();
    },

    async fetchAds() {
        this.showLoader(true);
        try {
            const params = new URLSearchParams({
                page: this.currentPage,
                limit: this.currentLimit
            });
            if (this.filters.categoria) params.append('categoria', this.filters.categoria);
            if (this.filters.activo) params.append('activo', this.filters.activo);
            if (this.filters.sort) params.append('sort', this.filters.sort);

            const res = await DashboardApp.apiFetch(`/ads?${params.toString()}`);
            const data = await res.json();
            
            if (res.ok && data.success) {
                this.totalPages = data.pagination.totalPages;
                this.totalItems = data.pagination.total;
                this.renderAds(data.data);
                this.renderPagination();
            } else {
                this.showToast(data.message || 'Error al cargar anuncios', 'error');
                this.renderAds([]);
            }
        } catch (error) {
            console.error('Error cargando anuncios:', error);
            this.showToast('Error de conexión al cargar anuncios', 'error');
        } finally {
            this.showLoader(false);
        }
    },

    showLoader(show) {
        if (show) {
            if(this.loader) this.loader.style.display = 'block';
            if(this.adsTable) this.adsTable.style.display = 'none';
            if(this.emptyState) this.emptyState.style.display = 'none';
        } else {
            if(this.loader) this.loader.style.display = 'none';
        }
    },

    getCategoryClass(cat) {
        const classes = {
            gaming: 'bg-primary bg-opacity-10 text-primary border-primary',
            tecnologia: 'bg-info bg-opacity-10 text-info border-info',
            eventos: 'bg-warning bg-opacity-10 text-warning border-warning',
            general: 'bg-secondary bg-opacity-10 text-secondary border-secondary'
        };
        return classes[cat] || classes.general;
    },

    renderAds(ads) {
        if (!ads || ads.length === 0) {
            if(this.emptyState) this.emptyState.style.display = 'block';
            if(this.adsTable) this.adsTable.style.display = 'none';
            if(this.paginationContainer) this.paginationContainer.style.display = 'none';
            return;
        }

        if(this.emptyState) this.emptyState.style.display = 'none';
        if(this.adsTable) this.adsTable.style.display = 'table';
        if(this.paginationContainer) this.paginationContainer.style.display = 'flex';

        let html = '';
        ads.forEach(ad => {
            const catClass = this.getCategoryClass(ad.categoria);
            const statusClass = ad.activo ? 'bg-success bg-opacity-10 text-success border-success' : 'bg-danger bg-opacity-10 text-danger border-danger';
            
            const progress = ad.impresiones_maximas > 0 
                ? Math.min((ad.impresiones_actuales / ad.impresiones_maximas) * 100, 100) 
                : 100;

            const domain = ad.enlace_destino ? ad.enlace_destino.replace(/^https?:\/\//, '').substring(0,25) : '';
            const adJsonStr = encodeURIComponent(JSON.stringify(ad));

            html += `
                <tr>
                    <td class="ps-4 py-3">
                        <div class="d-flex align-items-center">
                            <div class="flex-shrink-0 rounded bg-dark border border-secondary d-flex align-items-center justify-content-center overflow-hidden" style="width: 48px; height: 48px;">
                                ${ad.image_url ? `<img src="${ad.image_url}" alt="${ad.titulo}" class="w-100 h-100 object-fit-cover" onerror="this.onerror=null; this.outerHTML='<i class=\\'bi bi-image text-muted fs-4\\'></i>'">` : '<i class="bi bi-image text-muted fs-4"></i>'}
                            </div>
                            <div class="ms-3">
                                <h6 class="mb-1 fw-bold text-light">${ad.titulo} ${ad.prioridad >= 8 ? '<i class="bi bi-star-fill text-warning" title="Prioridad Alta"></i>' : ''}</h6>
                                <div class="text-secondary small text-truncate" style="max-width: 200px;" title="${ad.descripcion || ''}">${ad.descripcion || ''}</div>
                                ${ad.enlace_destino ? `<a href="${ad.enlace_destino}" target="_blank" class="small text-info text-decoration-none mt-1 d-inline-block"><i class="bi bi-box-arrow-up-right"></i> ${domain}...</a>` : ''}
                            </div>
                        </div>
                    </td>
                    <td>
                        <span class="badge border ${catClass}">${ad.categoria || 'general'}</span>
                    </td>
                    <td>
                        <button onclick="DashboardAds.toggleStatus('${ad.id}', ${ad.activo ? 'true' : 'false'}, decodeURIComponent('${adJsonStr}'))" class="btn btn-sm border fw-bold rounded-pill ${statusClass}" title="${ad.activo ? 'Click para pausar' : 'Click para activar'}">
                            <i class="bi ${ad.activo ? 'bi-check-circle' : 'bi-x-circle'} me-1"></i>
                            ${ad.activo ? 'Activa' : 'Pausada'}
                        </button>
                    </td>
                    <td>
                        <div style="font-size: 0.85rem;" class="text-secondary mb-1">
                            <div class="d-flex justify-content-between mb-1">
                                <span><i class="bi bi-eye"></i> ${ad.impresiones_actuales?.toLocaleString() || 0} / ${ad.impresiones_maximas || '∞'}</span>
                            </div>
                            <div class="d-flex justify-content-between">
                                <span><i class="bi bi-cursor"></i> ${ad.clics_count?.toLocaleString() || 0} clics</span>
                            </div>
                        </div>
                        ${ad.impresiones_maximas > 0 ? `
                        <div class="progress" style="height: 4px; background-color: var(--border-primary);">
                            <div class="progress-bar bg-primary" role="progressbar" style="width: ${progress}%"></div>
                        </div>
                        ` : ''}
                    </td>
                    <td class="text-end pe-4">
                        <button class="btn btn-sm btn-outline border-secondary text-primary" onclick="DashboardAds.editAd(decodeURIComponent('${adJsonStr}'))" title="Editar">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline border-secondary text-danger ms-1" onclick="DashboardAds.deleteAd('${ad.id}')" title="Eliminar">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        if(this.adsContainer) this.adsContainer.innerHTML = html;
    },

    renderPagination() {
        if (!this.paginationContainer) return;
        
        if (this.totalPages <= 1) {
            this.paginationContainer.style.display = 'none';
            return;
        }

        let infoLabel = `<span>Mostrando ${(this.currentPage - 1) * this.currentLimit + 1} al ${Math.min(this.currentPage * this.currentLimit, this.totalItems)} de ${this.totalItems} resultados</span>`;

        let html = `<ul class="pagination pagination-sm m-0 gap-1">`;
        
        html += `<li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
            <button class="page-link" onclick="DashboardAds.goToPage(${this.currentPage - 1})"><i class="bi bi-chevron-left"></i></button>
        </li>`;
        
        const delta = 2;
        const leftLimit = Math.max(1, this.currentPage - delta);
        const rightLimit = Math.min(this.totalPages, this.currentPage + delta);

        if (leftLimit > 1) {
            html += `<li class="page-item ${this.currentPage === 1 ? 'active' : ''}"><button class="page-link" onclick="DashboardAds.goToPage(1)">1</button></li>`;
            if (leftLimit > 2) html += `<li class="page-item disabled"><span class="page-link opacity-50">...</span></li>`;
        }

        for (let i = leftLimit; i <= rightLimit; i++) {
            if (i === 1 && leftLimit === 1) {
                html += `<li class="page-item ${this.currentPage === 1 ? 'active' : ''}"><button class="page-link" onclick="DashboardAds.goToPage(1)">1</button></li>`;
                continue;
            }
            html += `<li class="page-item ${i === this.currentPage ? 'active' : ''}">
                <button class="page-link" onclick="DashboardAds.goToPage(${i})">${i}</button>
            </li>`;
        }

        if (rightLimit < this.totalPages) {
            if (rightLimit < this.totalPages - 1) html += `<li class="page-item disabled"><span class="page-link opacity-50">...</span></li>`;
            html += `<li class="page-item ${this.currentPage === this.totalPages ? 'active' : ''}"><button class="page-link" onclick="DashboardAds.goToPage(${this.totalPages})">${this.totalPages}</button></li>`;
        }
        
        html += `<li class="page-item ${this.currentPage === this.totalPages ? 'disabled' : ''}">
            <button class="page-link" onclick="DashboardAds.goToPage(${this.currentPage + 1})"><i class="bi bi-chevron-right"></i></button>
        </li>`;
        
        html += `</ul>`;
        
        this.paginationContainer.innerHTML = `<div class="text-muted small">${infoLabel}</div><div>${html}</div>`;
    },

    goToPage(page) {
        if (page < 1 || page > this.totalPages) return;
        this.currentPage = page;
        this.fetchAds();
    },

    openModal() {
        this.cacheDOM(); // Enforce cache because direct clicks might miss initial cache
        let modalEl = this.adModal || document.getElementById('adModal');
        let titleEl = this.adModalTitle || document.getElementById('adModalTitle');
        let formEl = this.adForm || document.getElementById('adForm');

        this.editingAdId = null;
        if(formEl) formEl.reset();
        if(titleEl) titleEl.innerHTML = `<i class="bi bi-plus-circle text-primary me-2"></i> Crear Nuevo Anuncio`;
        if(modalEl) {
            modalEl.style.display = 'flex';
            setTimeout(() => modalEl.classList.add('show'), 10);
        }
    },

    closeModal() {
        let modalEl = this.adModal || document.getElementById('adModal');
        if(modalEl) {
            modalEl.classList.remove('show');
            setTimeout(() => {
                modalEl.style.display = 'none';
                this.editingAdId = null;
            }, 300);
        }
    },

    editAd(adJson) {
        this.cacheDOM();
        const ad = JSON.parse(adJson);
        this.editingAdId = ad.id;
        
        document.getElementById('adId').value = ad.id;
        document.getElementById('adTitle').value = ad.titulo || '';
        document.getElementById('adDescription').value = ad.descripcion || '';
        document.getElementById('adDestinationUrl').value = ad.enlace_destino || '';
        document.getElementById('adImageUrl').value = ad.image_url || '';
        document.getElementById('adCategory').value = ad.categoria || 'general';
        document.getElementById('adPriority').value = ad.prioridad || 1;
        document.getElementById('adMaxImpressions').value = ad.impresiones_maximas || 0;
        document.getElementById('adActive').checked = ad.activo;
        
        let modalEl = this.adModal || document.getElementById('adModal');
        let titleEl = this.adModalTitle || document.getElementById('adModalTitle');

        if(titleEl) titleEl.innerHTML = `<i class="bi bi-pencil text-primary me-2"></i> Modificar Anuncio`;
        if(modalEl) {
            modalEl.style.display = 'flex';
            setTimeout(() => modalEl.classList.add('show'), 10);
        }
    },

    async handleSaveAd(e) {
        e.preventDefault();
        
        const payload = {
            titulo: document.getElementById('adTitle').value,
            descripcion: document.getElementById('adDescription').value,
            enlace_destino: document.getElementById('adDestinationUrl').value,
            image_url: document.getElementById('adImageUrl').value,
            categoria: document.getElementById('adCategory').value,
            prioridad: parseInt(document.getElementById('adPriority').value) || 1,
            impresiones_maximas: parseInt(document.getElementById('adMaxImpressions').value) || 0,
            activo: document.getElementById('adActive').checked
        };

        const btn = document.getElementById('btnSaveAd');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Guardando...';
        btn.disabled = true;

        try {
            const endpoint = this.editingAdId ? `/ads/${this.editingAdId}` : '/ads';
            const method = this.editingAdId ? 'PUT' : 'POST';
            
            const res = await DashboardApp.apiFetch(endpoint, {
                method: method,
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            
            if (res.ok && data.success) {
                this.showToast(this.editingAdId ? '¡Anuncio actualizado con éxito!' : '¡Campaña lanzada con éxito!', 'success');
                this.closeModal();
                this.currentPage = 1;
                this.fetchAds();
                this.loadStats();
            } else {
                this.showToast(data.message || 'Error al guardar', 'error');
            }
        } catch (error) {
            console.error('Error guardando anuncio:', error);
            this.showToast('Error de conexión al guardar el anuncio', 'error');
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    },

    async toggleStatus(id, currentState, adJson) {
        try {
            const ad = JSON.parse(adJson);
            const newState = !currentState;
            
            const btnSelector = `button[onclick="DashboardAds.toggleStatus('${id}', ${currentState ? 'true' : 'false'}, decodeURIComponent('${encodeURIComponent(adJson)}'))"]`;
            const button = document.querySelector(btnSelector);
            if(button) {
                button.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
            }

            const payload = { ...ad, activo: newState };
            const res = await DashboardApp.apiFetch(`/ads/${id}`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            
            if (res.ok && data.success) {
                this.showToast(newState ? 'La campaña ha sido activada.' : 'La campaña ha sido pausada.', 'success');
                this.fetchAds();
            } else {
                this.showToast('Error al modificar estado', 'error');
                this.fetchAds();
            }
        } catch (error) {
            console.error('Error toggling status:', error);
            this.showToast('Error de conexión al actualizar el estado', 'error');
            this.fetchAds(); 
        }
    },

    async deleteAd(id) {
        if (!confirm('¿Estás seguro de que deseas eliminar permanentemente este anuncio? Esta acción no se puede deshacer.')) return;
        
        try {
            const res = await DashboardApp.apiFetch(`/ads/${id}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            
            if (res.ok && data.success) {
                this.showToast('Anuncio eliminado correctamente.', 'success');
                this.currentPage = 1;
                this.fetchAds();
                this.loadStats();
            } else {
                this.showToast(data.message || 'Error al eliminar el anuncio', 'error');
            }
        } catch (error) {
            console.error('Error eliminando anuncio:', error);
            this.showToast('Error de conexión al eliminar', 'error');
        }
    }
};

window.DashboardAds = DashboardAds;
