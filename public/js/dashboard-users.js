/**
 * dashboard-users.js
 * Handle CRUD operations for the Users tab.
 */

const DashboardUsers = {
    usersList: [],
    currentPage: 1,
    pageSize: 10,
    currentSort: 'desc',
    
    async load() {
        this.cacheDOM();
        this.bindEvents();
        await this.fetchUsers();
    },

    cacheDOM() {
        this.container = document.getElementById('usersListContainer');
        this.loader = document.getElementById('usersLoader');
        this.paginationContainer = document.getElementById('usersPaginationContainer');
        this.sortSelect = document.getElementById('usersSortSelect');
        
        // Modal
        this.modal = document.getElementById('userEditModal');
        this.form = document.getElementById('userEditForm');
    },

    changePage(page) {
        this.currentPage = page;
        this.renderUsers();
    },

    changeSort(sortOrder) {
        this.currentSort = sortOrder;
        this.currentPage = 1; // reset page on sort
        this.renderUsers();
    },

    bindEvents() {
        if (this._eventsBound) return;
        
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleSave(e));
        }

        this._eventsBound = true;
    },

    toggleLoader(show) {
        if(this.loader) {
            this.loader.style.display = show ? 'block' : 'none';
        }
    },

    async fetchUsers() {
        this.toggleLoader(true);
        try {
            const res = await DashboardApp.apiFetch('/users');
            const result = await res.json();
            
            if (res.ok && result.data) {
                this.usersList = result.data;
                this.renderUsers();
            } else {
                if(this.container) {
                    this.container.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Error: ${result.error || 'No se pudieron cargar los usuarios'}</td></tr>`;
                }
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            if(this.container) {
                this.container.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Error de conexión al cargar usuarios</td></tr>`;
            }
        } finally {
            this.toggleLoader(false);
        }
    },

    renderUsers() {
        if (!this.container) return;

        if (this.usersList.length === 0) {
            this.container.innerHTML = `<tr><td colspan="5" class="text-center p-4 text-muted"><i class="bi bi-people fs-1 d-block mb-2"></i>No hay usuarios registrados.</td></tr>`;
            if (this.paginationContainer) this.paginationContainer.innerHTML = '';
            return;
        }

        // Sort data
        const sorted = [...this.usersList].sort((a, b) => {
            const dateA = new Date(a.created_at).getTime();
            const dateB = new Date(b.created_at).getTime();
            return this.currentSort === 'asc' ? dateA - dateB : dateB - dateA;
        });

        // Paginate data
        const totalItems = sorted.length;
        const totalPages = Math.ceil(totalItems / this.pageSize) || 1;
        if (this.currentPage > totalPages) this.currentPage = totalPages;

        const startIndex = (this.currentPage - 1) * this.pageSize;
        const paginated = sorted.slice(startIndex, startIndex + this.pageSize);

        const html = paginated.map(user => {
            const dateStr = new Date(user.created_at).toLocaleDateString();
            const roleName = user.role || 'usuario';
            const badgeClass = roleName.toLowerCase() === 'administrador' ? 'bg-danger' : 
                               roleName.toLowerCase() === 'colaborador' ? 'bg-info text-dark' : 'bg-secondary';
                               
            return `
            <tr>
                <td class="ps-4">
                    <div class="d-flex align-items-center gap-2">
                        <div class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold" style="width: 32px; height: 32px; font-size: 14px;">
                            ${(user.nombre || '?').charAt(0).toUpperCase()}
                        </div>
                        <span class="fw-semibold">${this.escapeHtml(user.nombre)}</span>
                    </div>
                </td>
                <td class="text-muted">${this.escapeHtml(user.email)}</td>
                <td><span class="badge ${badgeClass} bg-opacity-75">${this.escapeHtml(roleName).toUpperCase()}</span></td>
                <td class="text-muted"><i class="bi bi-calendar3 me-1"></i> ${dateStr}</td>
                <td class="text-end pe-4">
                    <div class="d-flex justify-content-end gap-2">
                        <button class="btn btn-sm btn-primary d-flex align-items-center gap-2 px-3" onclick="DashboardUsers.openModal(${user.id})">
                            <i class="bi bi-pencil"></i> Editar
                        </button>
                        <button class="btn btn-sm btn-link text-danger p-1 opacity-50 hover-opacity-100" onclick="DashboardUsers.deleteUser(${user.id})" title="Eliminar Usuario">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
            `;
        }).join('');

        this.container.innerHTML = html;
        this.renderPagination(totalItems, totalPages);
    },

    renderPagination(totalItems, totalPages) {
        if (!this.paginationContainer) return;

        if (totalItems === 0) {
            this.paginationContainer.innerHTML = '';
            return;
        }

        const startItem = (this.currentPage - 1) * this.pageSize + 1;
        const endItem = Math.min(this.currentPage * this.pageSize, totalItems);

        let html = `
            <div class="text-muted small">
                Mostrando ${startItem} - ${endItem} de <strong>${totalItems}</strong> usuarios
            </div>
            <div class="btn-group">
                <button class="btn btn-sm btn-outline-secondary ${this.currentPage === 1 ? 'disabled' : ''}" onclick="DashboardUsers.changePage(${this.currentPage - 1})">
                    <i class="bi bi-chevron-left"></i> Ant.
                </button>
                <div class="btn btn-sm btn-outline-secondary disabled" style="pointer-events: none; opacity: 1; border-color: var(--border-secondary);">
                    Pág ${this.currentPage} de ${totalPages}
                </div>
                <button class="btn btn-sm btn-outline-secondary ${this.currentPage === totalPages ? 'disabled' : ''}" onclick="DashboardUsers.changePage(${this.currentPage + 1})">
                    Sig. <i class="bi bi-chevron-right"></i>
                </button>
            </div>
        `;
        
        this.paginationContainer.innerHTML = html;
    },

    openModal(userId) {
        const user = this.usersList.find(u => u.id === userId);
        if (!user) return;

        document.getElementById('editUserId').value = user.id;
        document.getElementById('editUserName').value = user.nombre || '';
        document.getElementById('editUserEmail').value = user.email || '';
        document.getElementById('editUserRole').value = user.role || 'usuario';

        if(this.modal) {
            this.modal.style.display = 'flex';
            setTimeout(() => this.modal.classList.add('show'), 10);
        }
    },

    closeModal() {
        if(this.modal) {
            this.modal.classList.remove('show');
            setTimeout(() => this.modal.style.display = 'none', 400);
        }
    },

    async handleSave(e) {
        e.preventDefault();
        const id = document.getElementById('editUserId').value;
        const payload = {
            nombre: document.getElementById('editUserName').value,
            email: document.getElementById('editUserEmail').value,
            role: document.getElementById('editUserRole').value
        };

        const btn = this.form.querySelector('button[type="submit"]');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Guardando...';
        btn.disabled = true;

        try {
            const res = await DashboardApp.apiFetch(`/users/${id}`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
            const result = await res.json();

            if (res.ok) {
                DashboardApp.showNotification('Usuario actualizado correctamente', 'success');
                this.closeModal();
                await this.fetchUsers();
            } else {
                DashboardApp.showNotification(result.error || 'Error al actualizar', 'error');
            }
        } catch (error) {
            console.error('Error saving user:', error);
            DashboardApp.showNotification('Error de conexión', 'error');
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    },

    async deleteUser(id) {
        if (!confirm('¿Estás seguro de que quieres eliminar a este usuario de forma permanente?')) return;
        
        try {
            const res = await DashboardApp.apiFetch(`/users/${id}`, { method: 'DELETE' });
            
            if (res.ok || res.status === 204) {
                DashboardApp.showNotification('Usuario eliminado', 'success');
                await this.fetchUsers();
            } else {
                const data = await res.json();
                DashboardApp.showNotification(data.error || 'Error al eliminar', 'error');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            DashboardApp.showNotification('Error de conexión', 'error');
        }
    },

    escapeHtml(unsafe) {
        return (unsafe || '').toString().replace(/[&<"'>]/g, function (m) {
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

window.DashboardUsers = DashboardUsers;
