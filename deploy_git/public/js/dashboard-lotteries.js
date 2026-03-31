/**
 * dashboard-lotteries.js
 * Manages fetching, Actions, and rendering for the Lotteries tab.
 */

const DashboardLotteries = {
    async load() {
        this.cacheDOM();
        this.bindEvents();
        await this.fetchLotteries();
        await this.loadStats();
    },

    cacheDOM() {
        this.container = document.getElementById('lotteriesListContainer');
        this.loader = document.getElementById('lotteriesLoader');
        
        // Stats
        this.statsTotal = document.getElementById('lotteryTotal');
        this.statsActive = document.getElementById('lotteryActive');
        this.statsFinished = document.getElementById('lotteryFinished');
        
        // Modal
        this.modal = document.getElementById('lotteryModal');
        this.form = document.getElementById('lotteryForm');
        this.createBtn = document.getElementById('btnCreateLottery');
    },

    bindEvents() {
        if (this._eventsBound) return;
        
        if(this.createBtn) {
            this.createBtn.addEventListener('click', () => this.openModal());
        }

        if(this.form) {
            this.form.addEventListener('submit', (e) => this.handleSave(e));
        }

        this._eventsBound = true;
    },

    toggleLoader(show) {
        if(this.loader) this.loader.style.display = show ? 'block' : 'none';
        if(this.container && show) this.container.innerHTML = '';
    },

    async loadStats() {
        try {
            // El backend no tiene ruta de /stats explícita para loterías, 
            // la guía indica: "Obtener todas para calcular silenciosamente"
            const res = await DashboardApp.apiFetch('/lotteries?limit=100');
            const data = await res.json();
            if (res.ok && data.success && data.data) {
                const total = data.data.length || 0;
                const active = data.data.filter(i => i.status === 'active').length || 0;
                const finished = data.data.filter(i => i.status === 'completed' || i.status === 'finished').length || 0;
                
                if(this.statsTotal) this.statsTotal.textContent = total;
                if(this.statsActive) this.statsActive.textContent = active;
                if(this.statsFinished) this.statsFinished.textContent = finished;
            }
        } catch (error) {
            console.error('Error fetching lottery stats:', error);
        }
    },

    async fetchLotteries() {
        this.toggleLoader(true);
        try {
            const res = await DashboardApp.apiFetch('/lotteries');
            const data = await res.json();
            
            if (res.ok && data.success) {
                this.render(data.data);
            } else {
                this.container.innerHTML = `<div class="alert alert-danger">Error: ${data.message || 'No se pudieron cargar los sorteos'}</div>`;
            }
        } catch (error) {
            console.error('Error fetching lotteries:', error);
            this.container.innerHTML = `<div class="alert alert-danger">Error de conexión al cargar sorteos</div>`;
        } finally {
            this.toggleLoader(false);
        }
    },

    render(items) {
        if (!items || items.length === 0) {
            this.container.innerHTML = `<div class="text-center p-4 text-muted"><i class="bi bi-ticket-perforated fs-1"></i><p>No hay sorteos registrados.</p></div>`;
            return;
        }

        const html = items.map(item => `
            <div class="news-item border-start border-4 ${item.status === 'active' ? 'border-success' : item.status === 'completed' ? 'border-primary' : 'border-secondary'}">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <div class="news-item-title">${this.escapeHtml(item.title)}</div>
                        <div class="news-meta mb-1">
                            <span class="badge ${item.status === 'active' ? 'bg-success' : item.status === 'completed' ? 'bg-primary' : 'bg-secondary'}">${item.status}</span>
                            <span>Premio: ${this.escapeHtml(item.prize)}</span>
                        </div>
                        <div class="news-desc small">Termina: ${new Date(item.end_date).toLocaleDateString()}</div>
                    </div>
                    <div class="d-flex gap-2 flex-wrap justify-content-end">
                        <button class="btn btn-sm btn-outline-info" onclick="DashboardLotteries.edit('${item.id}')" title="Editar"><i class="bi bi-pencil"></i></button>
                        ${item.status === 'pending' || item.status === 'draft' ? `<button class="btn btn-sm btn-outline-success" onclick="DashboardLotteries.updateStatus('${item.id}', 'active')" title="Activar"><i class="bi bi-play-circle"></i></button>` : ''}
                        ${item.status === 'active' ? `<button class="btn btn-sm btn-outline-primary" onclick="DashboardLotteries.updateStatus('${item.id}', 'completed')" title="Finalizar"><i class="bi bi-check2-circle"></i></button>` : ''}
                        <button class="btn btn-sm btn-outline-danger" onclick="DashboardLotteries.delete('${item.id}')" title="Eliminar"><i class="bi bi-trash"></i></button>
                    </div>
                </div>
            </div>
        `).join('');
        
        this.container.innerHTML = html;
    },

    openModal(data = null) {
        document.getElementById('lotteryId').value = data ? data.id : '';
        document.getElementById('lotteryTitle').value = data ? data.title : '';
        document.getElementById('lotteryDescription').value = data ? data.description : '';
        document.getElementById('lotteryPrize').value = data ? (data.prize_description || data.prize || '') : '';
        document.getElementById('lotteryMaxTickets').value = data ? (data.max_tickets || 100) : '100';
        document.getElementById('lotteryTicketPrice').value = data && data.ticket_price !== undefined ? data.ticket_price : '0';
        
        // Format dates for datetime-local input
        if (data && data.start_date) {
            const startStr = new Date(data.start_date).toISOString().slice(0, 16);
            document.getElementById('lotteryStartDate').value = startStr;
        } else {
            document.getElementById('lotteryStartDate').value = '';
        }

        if (data && data.end_date) {
            const endStr = new Date(data.end_date).toISOString().slice(0, 16);
            document.getElementById('lotteryEndDate').value = endStr;
        } else {
            document.getElementById('lotteryEndDate').value = '';
        }

        this.modal.style.display = 'flex';
        setTimeout(() => this.modal.classList.add('show'), 10);
    },

    closeModal() {
        this.modal.classList.remove('show');
        setTimeout(() => this.modal.style.display = 'none', 400);
    },

    async edit(id) {
        try {
            const res = await DashboardApp.apiFetch(`/lotteries/${id}`);
            const data = await res.json();
            if (res.ok && data.success) {
                this.openModal(data.data);
            } else {
                DashboardApp.showNotification('Error al cargar el sorteo', 'error');
            }
        } catch (error) {
            DashboardApp.showNotification('Error de conexión', 'error');
        }
    },

    async handleSave(e) {
        e.preventDefault();
        const id = document.getElementById('lotteryId').value;
        const startDateVal = document.getElementById('lotteryStartDate').value;
        const endDateVal = document.getElementById('lotteryEndDate').value;
        const payload = {
            title: document.getElementById('lotteryTitle').value,
            description: document.getElementById('lotteryDescription').value,
            prize_description: document.getElementById('lotteryPrize').value,
            max_tickets: parseInt(document.getElementById('lotteryMaxTickets').value, 10),
            ticket_price: parseFloat(document.getElementById('lotteryTicketPrice').value) || 0,
            start_date: startDateVal ? new Date(startDateVal).toISOString() : null,
            end_date: endDateVal ? new Date(endDateVal).toISOString() : null
        };
        payload.is_free = payload.ticket_price === 0;

        const method = id ? 'PUT' : 'POST';
        const endpoint = id ? `/lotteries/${id}` : '/lotteries';

        try {
            const res = await DashboardApp.apiFetch(endpoint, {
                method: method,
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (res.ok && data.success) {
                DashboardApp.showNotification(id ? 'Sorteo actualizado' : 'Sorteo creado', 'success');
                this.closeModal();
                this.fetchLotteries();
                this.loadStats();
            } else {
                DashboardApp.showNotification(data.message || 'Error al guardar el sorteo', 'error');
            }
        } catch (error) {
            DashboardApp.showNotification('Error de conexión', 'error');
        }
    },

    async updateStatus(id, newStatus) {
        if (!confirm(`¿Estás seguro de que quieres cambiar el estado a ${newStatus}?`)) return;
        
        try {
            let res;
            if (newStatus === 'active') {
                // To activate, we PUT the 'active' status directly
                res = await DashboardApp.apiFetch(`/lotteries/${id}`, { 
                    method: 'PUT',
                    body: JSON.stringify({ status: 'active' })
                });
            } else if (newStatus === 'completed') {
                // To finish, we POST to /finish route
                res = await DashboardApp.apiFetch(`/lotteries/${id}/finish`, { 
                    method: 'POST',
                    body: JSON.stringify({ force: true, winner_selection_method: 'random' }) 
                });
            }

            const data = await res.json();
            
            if (res.ok && data.success) {
                DashboardApp.showNotification('Estado actualizado', 'success');
                this.fetchLotteries();
                this.loadStats();
            } else {
                DashboardApp.showNotification(data.message || 'Error al actualizar', 'error');
            }
        } catch (error) {
            console.error(error);
            DashboardApp.showNotification('Error de conexión', 'error');
        }
    },

    async delete(id) {
        if (!confirm('¿Estás seguro de que quieres eliminar este sorteo de forma PERMANENTE?')) return;
        
        try {
            const res = await DashboardApp.apiFetch(`/lotteries/${id}`, { method: 'DELETE' });
            const data = await res.json();
            
            if (res.ok && data.success) {
                DashboardApp.showNotification('Sorteo eliminado', 'success');
                this.fetchLotteries();
                this.loadStats();
            } else {
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

window.DashboardLotteries = DashboardLotteries;
