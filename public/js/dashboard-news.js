/**
 * dashboard-news.js
 * Manages fetching, CRUD operations, and rendering for the News tab.
 */

const DashboardNews = {
    currentPage: 1,
    currentSort: 'latest',
    rssList: [],
    selectedNewsIds: new Set(),

    async load() {
        this.cacheDOM();
        this.bindEvents();
        await this.fetchNews();
    },

    cacheDOM() {
        this.newsContainer = document.getElementById('newsListContainer');
        this.paginationContainer = document.getElementById('newsPaginationContainer');
        this.sortSelect = document.getElementById('newsSortSelect');
        this.loader = document.getElementById('newsLoader');
        
        // Modal
        this.newsModal = document.getElementById('newsModal');
        this.newsForm = document.getElementById('newsForm');
        this.createBtn = document.getElementById('btnCreateNews');
    },

    bindEvents() {
        // Only bind once, avoid stacking
        if (this._eventsBound) return;
        
        if(this.sortSelect) {
            this.sortSelect.addEventListener('change', (e) => {
                this.currentSort = e.target.value;
                this.currentPage = 1;
                this.fetchNews();
            });
        }
        
        if(this.createBtn) {
            this.createBtn.addEventListener('click', () => this.openNewsModal());
        }

        if(this.newsForm) {
            this.newsForm.addEventListener('submit', (e) => this.handleSaveNews(e));
        }
        
        const rssSelect = document.getElementById('newsRssSelect');
        if(rssSelect) {
            rssSelect.addEventListener('change', (e) => this.fillFromRss(e.target.value));
        }

        const newsImportForm = document.getElementById('newsImportForm');
        if (newsImportForm) {
            newsImportForm.addEventListener('submit', (e) => this.handleSSEImport(e));
        }

        this._eventsBound = true;
    },

    toggleLoader(show) {
        if(this.loader) this.loader.style.display = show ? 'block' : 'none';
        if(this.newsContainer && show) this.newsContainer.innerHTML = '';
    },

    async fetchNews() {
        this.toggleLoader(true);
        try {
            const res = await DashboardApp.apiFetch(`/news?page=${this.currentPage}&sort=${this.currentSort}`);
            const data = await res.json();
            
            if (res.ok && data.success) {
                this.renderNews(data.data);
                this.renderPagination(data.pagination);
            } else {
                this.newsContainer.innerHTML = `<div class="alert alert-danger">Error: ${data.message || 'No se pudieron cargar las noticias'}</div>`;
            }
        } catch (error) {
            console.error('Error fetching news:', error);
            this.newsContainer.innerHTML = `<div class="alert alert-danger">Error de conexión al cargar noticias</div>`;
        } finally {
            this.toggleLoader(false);
        }
    },

    renderNews(newsItems) {
        if (!newsItems || newsItems.length === 0) {
            this.newsContainer.innerHTML = `<div class="text-center p-4 text-muted"><i class="bi bi-inbox fs-1"></i><p>No hay noticias disponibles.</p></div>`;
            return;
        }

        const html = newsItems.map(item => `
        <div class="news-item ${this.selectedNewsIds.has(item.id) ? 'selected' : ''}" data-news-id="${item.id}">
            <div class="news-header d-flex gap-2 align-items-center mb-2">
                <input type="checkbox" class="news-checkbox form-check-input mt-0" value="${item.id}" ${this.selectedNewsIds.has(item.id) ? 'checked' : ''} onchange="DashboardNews.toggleSelection(${item.id})" onclick="event.stopPropagation()">
                <h4 class="news-item-title m-0">${this.escapeHtml(item.titulo || item.title)}</h4>
            </div>
            
            <div class="news-meta mb-2">
                <span><i class="bi bi-calendar"></i> ${new Date(item.published_at || item.date || item.created_at).toLocaleDateString()}</span>
                <span><i class="bi bi-person"></i> ${this.escapeHtml(item.autor || 'Anónimo')}</span>
                <span class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25">${item.is_oficial ? 'Oficial' : 'Usuario'}</span>
            </div>
            
            <div class="news-desc mb-3">
                ${this.escapeHtml((item.descripcion || item.content || '').substring(0, 250))}...
            </div>
            
            <div class="d-flex justify-content-between align-items-center mt-3 pt-3 border-top" style="border-color: var(--border-primary) !important;">
                <div class="news-stats d-flex gap-3">
                    <div class="news-stat opacity-75">
                        <i class="bi bi-hand-thumbs-up"></i>
                        <span>${item.likes_count || 0}</span>
                    </div>
                    <div class="news-stat opacity-75">
                        <i class="bi bi-chat-dots"></i>
                        <span>${item.comments_count || 0}</span>
                    </div>
                </div>
                
                <div class="news-actions d-flex gap-2">
                    <button class="btn btn-outline btn-sm px-3" onclick="event.stopPropagation(); DashboardNews.editNews('${item.id}')">
                        <i class="bi bi-pencil"></i> Editar
                    </button>
                    <button class="btn btn-outline border-danger text-danger btn-sm px-2 opacity-50 hover-opacity-100" onclick="event.stopPropagation(); DashboardNews.deleteNews('${item.id}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        </div>
        `).join('');
        
        this.newsContainer.innerHTML = html;
        this.updateDeleteBtnVisibility();
    },

    renderPagination(pagination) {
        if (!pagination || pagination.totalPages <= 1 || !this.paginationContainer) {
            if(this.paginationContainer) this.paginationContainer.innerHTML = '';
            return;
        }

        let html = `<ul class="pagination pagination-sm justify-content-center flex-wrap gap-1">`;
        
        // Prev
        html += `<li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
            <button class="page-link" onclick="DashboardNews.goToPage(${this.currentPage - 1})"><i class="bi bi-chevron-left"></i></button>
        </li>`;
        
        const delta = 2;
        const leftLimit = Math.max(1, this.currentPage - delta);
        const rightLimit = Math.min(pagination.totalPages, this.currentPage + delta);

        if (leftLimit > 1) {
            html += `<li class="page-item ${this.currentPage === 1 ? 'active' : ''}"><button class="page-link" onclick="DashboardNews.goToPage(1)">1</button></li>`;
            if (leftLimit > 2) html += `<li class="page-item disabled"><span class="page-link opacity-50">...</span></li>`;
        }

        for (let i = leftLimit; i <= rightLimit; i++) {
            if (i === 1 && leftLimit === 1) {
                html += `<li class="page-item ${this.currentPage === 1 ? 'active' : ''}"><button class="page-link" onclick="DashboardNews.goToPage(1)">1</button></li>`;
                continue;
            }
            html += `<li class="page-item ${i === this.currentPage ? 'active' : ''}">
                <button class="page-link" onclick="DashboardNews.goToPage(${i})">${i}</button>
            </li>`;
        }

        if (rightLimit < pagination.totalPages) {
            if (rightLimit < pagination.totalPages - 1) html += `<li class="page-item disabled"><span class="page-link opacity-50">...</span></li>`;
            html += `<li class="page-item ${this.currentPage === pagination.totalPages ? 'active' : ''}"><button class="page-link" onclick="DashboardNews.goToPage(${pagination.totalPages})">${pagination.totalPages}</button></li>`;
        }
        
        // Next
        html += `<li class="page-item ${this.currentPage === pagination.totalPages ? 'disabled' : ''}">
            <button class="page-link" onclick="DashboardNews.goToPage(${this.currentPage + 1})"><i class="bi bi-chevron-right"></i></button>
        </li>`;
        
        html += `</ul>`;
        this.paginationContainer.innerHTML = html;
    },

    goToPage(page) {
        this.currentPage = page;
        this.fetchNews();
    },

    openNewsModal(news = null) {
        document.getElementById('newsId').value = news ? news.id : '';
        document.getElementById('newsTitle').value = news ? (news.titulo || news.title) : '';
        document.getElementById('newsContent').value = news ? (news.descripcion || news.content) : '';
        document.getElementById('newsCategory').value = news ? news.category : 'General';
        document.getElementById('newsImgUrl').value = news && news.image_url ? news.image_url : '';
        document.getElementById('newsOriginalUrl').value = news && news.original_url ? news.original_url : '';
        
        // Reset RSS Select
        const select = document.getElementById('newsRssSelect');
        if(select) {
            select.innerHTML = '<option value="">Haz clic en Cargar para ver últimas noticias...</option>';
            this.rssList = [];
        }
        
        this.newsModal.style.display = 'flex';
        setTimeout(() => this.newsModal.classList.add('show'), 10);
    },

    closeNewsModal() {
        this.newsModal.classList.remove('show');
        setTimeout(() => this.newsModal.style.display = 'none', 400);
    },

    async editNews(id) {
        try {
            const res = await DashboardApp.apiFetch(`/news/${id}`);
            const data = await res.json();
            if (res.ok && data.success) {
                this.openNewsModal(data.data);
            } else {
                DashboardApp.showNotification('Error al cargar la noticia', 'error');
            }
        } catch (error) {
            DashboardApp.showNotification('Error de conexión', 'error');
        }
    },

    async handleSaveNews(e) {
        e.preventDefault();
        const id = document.getElementById('newsId').value;
        const payload = {
            titulo: document.getElementById('newsTitle').value,
            descripcion: document.getElementById('newsContent').value,
            category: document.getElementById('newsCategory').value,
            image_url: document.getElementById('newsImgUrl').value || null,
            original_url: document.getElementById('newsOriginalUrl').value || null,
            is_oficial: true
        };

        const method = id ? 'PUT' : 'POST';
        const endpoint = id ? `/news/${id}` : '/news';

        try {
            const res = await DashboardApp.apiFetch(endpoint, {
                method: method,
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (res.ok && data.success) {
                DashboardApp.showNotification(id ? 'Noticia actualizada' : 'Noticia creada', 'success');
                this.closeNewsModal();
                this.fetchNews();
            } else {
                DashboardApp.showNotification(data.message || 'Error al guardar la noticia', 'error');
            }
        } catch (error) {
            DashboardApp.showNotification('Error de conexión', 'error');
        }
    },

    async deleteNews(id) {
        if (!confirm('¿Estás seguro de que quieres eliminar esta noticia?')) return;
        
        try {
            const res = await DashboardApp.apiFetch(`/news/${id}`, { method: 'DELETE' });
            const data = await res.json();
            
            if (res.ok && data.success) {
                DashboardApp.showNotification('Noticia eliminada', 'success');
                this.fetchNews();
            } else {
                DashboardApp.showNotification(data.message || 'Error al eliminar la noticia', 'error');
            }
        } catch (error) {
            DashboardApp.showNotification('Error de conexión', 'error');
        }
    },

    async loadRssPreview() {
        const btn = document.getElementById('btnLoadRss');
        const select = document.getElementById('newsRssSelect');
        if(!select || !btn) return;
        
        btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
        btn.disabled = true;
        
        try {
            const res = await DashboardApp.apiFetch('/news/rss/preview');
            const data = await res.json();
            
            if (res.ok && data.success) {
                this.rssList = data.data;
                let html = '<option value="">Selecciona una noticia importada...</option>';
                this.rssList.forEach((item, index) => {
                    html += `<option value="${index}">${item.title}</option>`;
                });
                select.innerHTML = html;
                DashboardApp.showNotification('Noticias RSS cargadas', 'success');
            } else {
                DashboardApp.showNotification(data.message || 'Error al cargar RSS', 'error');
            }
        } catch (err) {
            console.error(err);
            DashboardApp.showNotification('Error de conexión parseando RSS', 'error');
        } finally {
            btn.innerHTML = '<i class="bi bi-cloud-download"></i> Cargar';
            btn.disabled = false;
        }
    },
    
    fillFromRss(indexStr) {
        if(!indexStr || indexStr === '') return;
        const index = parseInt(indexStr, 10);
        const item = this.rssList[index];
        if(!item) return;
        
        document.getElementById('newsTitle').value = item.title || '';
        document.getElementById('newsContent').value = item.description || '';
        document.getElementById('newsImgUrl').value = item.image_url || '';
        document.getElementById('newsOriginalUrl').value = item.original_url || '';
    },

    // Utilities Event Handlers for SSE Import Modal
    openImportNewsModal() {
        const modal = document.getElementById('newsImportModal');
        if(modal) {
            modal.style.display = 'flex';
            setTimeout(() => modal.classList.add('show'), 10);
        }
    },

    closeImportNewsModal() {
        const modal = document.getElementById('newsImportModal');
        if(modal) {
            modal.classList.remove('show');
            setTimeout(() => modal.style.display = 'none', 400);
        }
    },

    handleSSEImport(e) {
        e.preventDefault();
        const form = e.target;
        const importText = form.querySelector('.import-text');
        const loadingSpinner = form.querySelector('.loading-spinner');
        const logArea = document.getElementById('newsImportLog');
        
        if (importText) importText.classList.add('d-none');
        if (loadingSpinner) loadingSpinner.classList.remove('d-none');

        const index = parseInt(document.getElementById('newsImportIndex').value, 10);
        const token = localStorage.getItem('authToken'); // Use native login token

        if (logArea) logArea.value = '';

        const url = new URL('/api/v1/news/import/stream', window.location.origin);
        url.searchParams.set('index', Number.isInteger(index) && index >= 0 ? index : 0);

        fetch(url.toString(), { headers: { 'Authorization': `Bearer ${token}` } }).then(async (res) => {
            if (!res.ok || !res.body) throw new Error('No se pudo iniciar el stream');
            
            const reader = res.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let buffer = '';

            const appendLog = (text) => {
                if (!logArea) return;
                logArea.value += (text + '\n');
                logArea.scrollTop = logArea.scrollHeight;
            };

            appendLog('Iniciando importación...');

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });

                let idx;
                while ((idx = buffer.indexOf('\n\n')) >= 0) {
                    const chunk = buffer.slice(0, idx);
                    buffer = buffer.slice(idx + 2);

                    const lines = chunk.split('\n');
                    let eventType = 'message';
                    let data = '';
                    for (const line of lines) {
                        if (line.startsWith('event: ')) eventType = line.replace('event: ', '').trim();
                        if (line.startsWith('data: ')) data += line.replace('data: ', '') + '\n';
                    }
                    data = data.trim();

                    if (eventType === 'log') appendLog(data);
                    else if (eventType === 'error') appendLog('[ERROR] ' + data);
                    else if (eventType === 'done') {
                        if (data === 'ok') {
                            appendLog('Importación completada.');
                            DashboardApp.showNotification('Noticia importada correctamente', 'success');
                            this.fetchNews(); // Recargar lista
                        } else {
                            appendLog('Importación finalizada con código: ' + data);
                            DashboardApp.showNotification('La importación terminó con errores', 'error');
                        }
                    }
                }
            }
        }).catch((err) => {
            console.error('SSE error:', err);
            DashboardApp.showNotification(err.message || 'Error al importar la noticia', 'error');
        }).finally(() => {
            if (importText) importText.classList.remove('d-none');
            if (loadingSpinner) loadingSpinner.classList.add('d-none');
        });
    },

    toggleSelection(id) {
        if (this.selectedNewsIds.has(id)) {
            this.selectedNewsIds.delete(id);
        } else {
            this.selectedNewsIds.add(id);
        }
        this.updateDeleteBtnVisibility();
        const item = document.querySelector(`.news-item[data-news-id="${id}"]`);
        if (item) item.classList.toggle('selected');
    },

    updateDeleteBtnVisibility() {
        const btn = document.getElementById('deleteSelectedBtn');
        if (!btn) return;
        if (this.selectedNewsIds.size > 0) {
            btn.style.display = 'inline-block';
            btn.innerHTML = `<i class="bi bi-trash"></i> Eliminar Seleccionadas (${this.selectedNewsIds.size})`;
        } else {
            btn.style.display = 'none';
        }
    },

    async deleteSelectedNews() {
        if (this.selectedNewsIds.size === 0) return;
        if (!confirm(`¿Estás seguro de que quieres eliminar ${this.selectedNewsIds.size} noticia(s)?`)) return;
        
        try {
            const promises = Array.from(this.selectedNewsIds).map(newsId =>
                DashboardApp.apiFetch(`/news/${newsId}`, { method: 'DELETE' })
            );
            
            await Promise.all(promises);
            DashboardApp.showNotification(`${this.selectedNewsIds.size} noticia(s) eliminada(s) correctamente`, 'success');
            this.selectedNewsIds.clear();
            this.updateDeleteBtnVisibility();
            this.fetchNews();
        } catch (error) {
            console.error('Error deleting batch news:', error);
            DashboardApp.showNotification('Error al eliminar las noticias', 'error');
        }
    },

    // Utilities
    escapeHtml(unsafe) {
        return (unsafe || '').replace(/[&<"'>]/g, function (m) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            }[m];
        });
    }
};

window.DashboardNews = DashboardNews;
