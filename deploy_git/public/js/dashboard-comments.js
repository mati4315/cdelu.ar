/**
 * dashboard-comments.js
 * Logic for managing all platform comments (News + Community)
 */

const DashboardComments = {
    currentPage: 1,
    limit: 20,

    async load() {
        this.cacheDOM();
        this.bindEvents();
        await this.fetchComments();
    },

    cacheDOM() {
        this.container = document.getElementById('commentsListContainer');
        this.loader = document.getElementById('commentsLoader');
        this.table = document.getElementById('commentsTable');
        this.paginationContainer = document.getElementById('commentsPaginationContainer');
    },

    bindEvents() {
        // No specific events beyond dynamic buttons for now
    },

    toggleLoader(show) {
        if(this.loader) this.loader.style.display = show ? 'block' : 'none';
        if(this.table) this.table.style.display = show ? 'none' : 'table';
    },

    async fetchComments(page = 1) {
        this.currentPage = page;
        this.toggleLoader(true);
        try {
            const res = await DashboardApp.apiFetch(`/admin/comments?page=${this.currentPage}&limit=${this.limit}`);
            const data = await res.json();

            if (res.ok && data.success) {
                this.render(data.data);
                this.renderPagination(data.pagination);
            } else {
                DashboardApp.showNotification(data.message || 'Error cargando comentarios', 'error');
            }
        } catch (error) {
            console.error('Error fetching admin comments:', error);
            DashboardApp.showNotification('Error de conexión con el servidor', 'error');
        } finally {
            this.toggleLoader(false);
        }
    },

    render(items) {
        if (!items || items.length === 0) {
            this.container.innerHTML = `<tr><td colspan="5" class="text-center py-5 text-muted"><i class="bi bi-chat-left-dots fs-1 d-block mb-3"></i>No se encontraron comentarios para moderar.</td></tr>`;
            return;
        }

        const html = items.map(item => `
            <tr>
                <td class="ps-4">
                    <div class="d-flex align-items-center gap-2">
                        <div class="bg-secondary bg-opacity-10 rounded-circle d-flex justify-content-center align-items-center" style="width: 32px; height: 32px;">
                            <i class="bi bi-person text-muted"></i>
                        </div>
                        <span class="fw-bold">${this.escapeHtml(item.user_name || 'Usuario Anónimo')}</span>
                    </div>
                </td>
                <td>
                    <div class="text-wrap" style="max-width: 400px; font-size: 0.9rem;">
                        ${this.escapeHtml(item.content)}
                    </div>
                </td>
                <td>
                    <div class="d-flex flex-column">
                        <span class="badge ${item.type === 'news' ? 'bg-info bg-opacity-10 text-info' : 'bg-primary bg-opacity-10 text-primary'} border-0 px-2 py-1 align-self-start mb-1">
                            ${item.type === 'news' ? 'Noticias' : 'Comunidad'}
                        </span>
                        <a href="${item.type === 'news' ? `/news.html?id=${item.target_id}` : `/comunidad/${item.target_id}`}" 
                           target="_blank" 
                           class="small text-decoration-none text-primary fw-bold">
                           <i class="bi bi-box-arrow-up-right me-1"></i>ID: ${item.target_id}
                        </a>
                    </div>
                </td>
                <td>
                    <span class="small text-muted"><i class="bi bi-clock me-1"></i>${new Date(item.created_at).toLocaleString()}</span>
                </td>
                <td class="text-end pe-4">
                    <button class="btn btn-sm btn-outline-danger border-0" onclick="DashboardComments.delete('${item.type}', '${item.id}')" title="Eliminar Comentario">
                        <i class="bi bi-trash"></i>
                    </button>
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
        
        let html = `<div class="text-muted small">Página ${pagination.page} de ${pagination.pages} (${pagination.total} total)</div>`;
        html += `<div class="d-flex gap-2">`;
        
        if (pagination.page > 1) {
            html += `<button class="btn btn-sm btn-outline border-secondary" onclick="DashboardComments.fetchComments(${pagination.page - 1})"><i class="bi bi-chevron-left"></i></button>`;
        }
        
        if (pagination.page < pagination.pages) {
            html += `<button class="btn btn-sm btn-outline border-secondary" onclick="DashboardComments.fetchComments(${pagination.page + 1})"><i class="bi bi-chevron-right"></i></button>`;
        }
        
        html += `</div>`;
        this.paginationContainer.innerHTML = html;
    },

    async delete(type, id) {
        if (!confirm('¿Estás seguro de eliminar este comentario permanentemente? Esta acción no se puede deshacer.')) return;

        try {
            const res = await DashboardApp.apiFetch(`/admin/comments/${type}/${id}`, {
                method: 'DELETE'
            });

            if (res.status === 204) {
                DashboardApp.showNotification('Comentario eliminado correctamente', 'success');
                await this.fetchComments(this.currentPage);
            } else {
                const data = await res.json();
                DashboardApp.showNotification(data.message || 'Error al eliminar comentario', 'error');
            }
        } catch (error) {
            console.error('Error deleting comment:', error);
            DashboardApp.showNotification('Error de conexión', 'error');
        }
    },

    escapeHtml(unsafe) {
        return (unsafe || '').replace(/[&<"'>]/g, function (m) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
        });
    }
};

window.DashboardComments = DashboardComments;
