/**
 * dashboard-com.js
 * Manages fetching, Actions, and rendering for the Community (Comunicaciones) tab.
 */

const DashboardCom = {
    currentPage: 1,
    limit: 10,
    
    async load() {
        this.cacheDOM();
        this.bindEvents();
        await this.fetchComs();
    },

    cacheDOM() {
        this.container = document.getElementById('comListContainer');
        this.loader = document.getElementById('comLoader');
        this.table = document.getElementById('comTable');
        this.paginationContainer = document.getElementById('comPaginationContainer');
        
        // Modal
        this.modal = document.getElementById('comModal');
        this.form = document.getElementById('comForm');
    },

    bindEvents() {
        if (this._eventsBound) return;
        
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleSave(e));
        }

        this._eventsBound = true;
    },

    toggleLoader(show) {
        if(this.loader) this.loader.style.display = show ? 'block' : 'none';
        if(this.table) this.table.style.display = show ? 'none' : 'table';
    },

    async fetchComs(page = 1) {
        this.currentPage = page;
        this.toggleLoader(true);
        try {
            const res = await DashboardApp.apiFetch(`/com?page=${this.currentPage}&limit=${this.limit}&sort=created_at&order=desc`);
            const data = await res.json();
            
            if (res.ok) {
                // If the response shape has success/data OR just data:
                const items = data.data || [];
                const pagination = data.pagination || { total: 0, pages: 1 };
                this.render(items);
                this.renderPagination(pagination);
            } else {
                DashboardApp.showNotification(data.message || 'Error cargando comunicaciones', 'error');
            }
        } catch (error) {
            console.error('Error fetching coms:', error);
            DashboardApp.showNotification('Error de conexión', 'error');
        } finally {
            this.toggleLoader(false);
        }
    },

    render(items) {
        if (!items || items.length === 0) {
            this.container.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-muted"><i class="bi bi-chat-dots fs-1 d-block mb-2"></i>No hay publicaciones de la comunidad.</td></tr>`;
            return;
        }

        const html = items.map(item => `
            <tr>
                <td class="ps-4">
                    <div class="d-flex align-items-center gap-3">
                        <div class="com-icon bg-primary bg-opacity-10 text-primary rounded d-flex justify-content-center align-items-center" style="width: 48px; height: 48px;">
                            ${item.image_url ? 
                                `<img src="${item.image_url}" class="rounded" style="width:100%; height:100%; object-fit:cover;" onerror="this.onerror=null; this.outerHTML='<i class=\\'bi bi-image text-muted fs-4\\'></i>'">` : 
                                `<i class="bi bi-chat-text fs-4"></i>`
                            }
                        </div>
                        <div>
                            <div class="fw-bold">${this.escapeHtml(item.titulo)}</div>
                            <div class="small text-muted">ID: #${item.id}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="text-truncate d-inline-block" style="max-width: 250px;">
                        ${this.escapeHtml(item.descripcion)}
                    </span>
                </td>
                <td>
                    <span class="small text-muted"><i class="bi bi-calendar3 me-1"></i>${new Date(item.created_at).toLocaleDateString()}</span>
                </td>
                <td class="text-end pe-4">
                    <button class="btn btn-sm btn-outline-info me-1" onclick="DashboardCom.edit('${item.id}')" title="Editar"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-outline-danger" onclick="DashboardCom.delete('${item.id}')" title="Eliminar"><i class="bi bi-trash"></i></button>
                </td>
            </tr>
        `).join('');
        
        this.container.innerHTML = html;
    },

    renderPagination(pagination) {
        if (!this.paginationContainer) return;
        
        if (!pagination || pagination.pages <= 1) {
            this.paginationContainer.style.display = 'none';
            return;
        }

        this.paginationContainer.style.display = 'flex';
        
        let html = `<div class="text-muted small">Mostrando página ${pagination.page} de ${pagination.pages} (Total: ${pagination.total})</div>`;
        html += `<div class="d-flex gap-2">`;
        
        if (pagination.page > 1) {
            html += `<button class="btn btn-sm btn-outline" onclick="DashboardCom.fetchComs(${pagination.page - 1})"><i class="bi bi-chevron-left"></i></button>`;
        }
        
        if (pagination.page < pagination.pages) {
            html += `<button class="btn btn-sm btn-outline" onclick="DashboardCom.fetchComs(${pagination.page + 1})"><i class="bi bi-chevron-right"></i></button>`;
        }
        
        html += `</div>`;
        this.paginationContainer.innerHTML = html;
    },

    openModal(data = null) {
        document.getElementById('comId').value = data ? data.id : '';
        document.getElementById('comTitle').value = data ? data.titulo : '';
        document.getElementById('comDescription').value = data ? data.descripcion : '';
        
        // Reset file inputs because we can't show existing files in input[type=file]
        document.getElementById('comImage').value = '';
        document.getElementById('comVideo').value = '';

        document.getElementById('comModalTitle').innerHTML = data ? 
            '<i class="bi bi-chat-dots-fill text-primary me-2"></i> Editar Publicación' : 
            '<i class="bi bi-chat-dots-fill text-primary me-2"></i> Nueva Publicación';

        this.modal.style.display = 'flex';
        setTimeout(() => this.modal.classList.add('show'), 10);
    },

    closeModal() {
        this.modal.classList.remove('show');
        setTimeout(() => this.modal.style.display = 'none', 400);
    },

    async edit(id) {
        try {
            const res = await DashboardApp.apiFetch(`/com/${id}`);
            const data = await res.json();
            
            // Depends on Backend shape. If it's pure data or nested under `data`.
            const item = data.data || data; 
            if (res.ok) {
                this.openModal(item);
            } else {
                DashboardApp.showNotification(data.message || 'Error al cargar publicación', 'error');
            }
        } catch (error) {
            DashboardApp.showNotification('Error de conexión', 'error');
        }
    },

    async handleSave(e) {
        e.preventDefault();
        
        const id = document.getElementById('comId').value;
        const btnSave = document.getElementById('btnSaveCom');
        const originalText = btnSave.innerHTML;
        
        btnSave.disabled = true;
        btnSave.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Guardando...';

        try {
            let res;
            
            // If editing, docs say: Content-Type: application/json
            if (id) {
                const payload = {
                    titulo: document.getElementById('comTitle').value,
                    descripcion: document.getElementById('comDescription').value
                };
                
                res = await DashboardApp.apiFetch(`/com/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload)
                });
            } else {
                // If creating, docs say: Content-Type: multipart/form-data
                const formData = new FormData();
                formData.append('titulo', document.getElementById('comTitle').value);
                formData.append('descripcion', document.getElementById('comDescription').value);
                
                const imageFile = document.getElementById('comImage').files[0];
                if (imageFile) formData.append('image', imageFile);
                
                const videoFile = document.getElementById('comVideo').files[0];
                if (videoFile) formData.append('video', videoFile);

                res = await fetch(`${DashboardApp.config.API_BASE_URL}/com`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${DashboardApp.token}`
                        // For FormData, do not set Content-Type header manually
                    },
                    body: formData
                });
            }

            const data = await res.json();
            
            if (res.ok) {
                DashboardApp.showNotification(id ? 'Publicación actualizada' : 'Publicación creada', 'success');
                this.closeModal();
                this.fetchComs();
            } else {
                DashboardApp.showNotification(data.message || 'Error al guardar la publicación', 'error');
            }
        } catch (error) {
            DashboardApp.showNotification('Error de conexión', 'error');
        } finally {
            btnSave.disabled = false;
            btnSave.innerHTML = originalText;
        }
    },

    async delete(id) {
        if (!confirm('¿Estás seguro de eliminar esta publicación de la comunidad?')) return;
        
        try {
            // Because DELETE doesn't need body, apiFetch strips the application/json header automatically
            const res = await DashboardApp.apiFetch(`/com/${id}`, { method: 'DELETE' });
            
            // Backend Docs say 204 No Content for delete means success
            if (res.status === 204 || res.ok) {
                DashboardApp.showNotification('Publicación eliminada', 'success');
                this.fetchComs();
            } else {
                const data = await res.json();
                DashboardApp.showNotification(data.message || 'Error al eliminar', 'error');
            }
        } catch (error) {
            DashboardApp.showNotification('Error de conexión', 'error');
        }
    },

    escapeHtml(unsafe) {
        return (unsafe || '').replace(/[&<"'>]/g, function (m) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
        });
    }
};

window.DashboardCom = DashboardCom;
