/**
 * dashboard-stats.js
 * Handles the logic for the general Stats tab in the Dashboard.
 */

const DashboardStats = {
    async load() {
        this.cacheDOM();
        await this.fetchStats();
    },

    cacheDOM() {
        this.totalNews = document.getElementById('statTotalNews');
        this.totalUsers = document.getElementById('statTotalUsers');
        this.totalLikes = document.getElementById('statTotalLikes');
        this.totalComments = document.getElementById('statTotalComments');
        this.activeLotteries = document.getElementById('statActiveLotteries');
        this.totalParts = document.getElementById('statTotalParts');
        this.ticketsSold = document.getElementById('statTicketsSold');
        this.revenue = document.getElementById('statRevenue');
        
        // System status
        this.dbStatus = document.getElementById('statDbStatus');
        this.uptime = document.getElementById('statUptime');
        
        this.container = document.getElementById('dashboard-content');
        this.loader = this.container ? this.container.querySelector('.section-loader') : null;
    },

    toggleLoader(show) {
        if(this.loader) {
            this.loader.style.display = show ? 'flex' : 'none';
        }
    },

    async fetchStats() {
        this.toggleLoader(true);
        try {
            // Fetch stats simultaneously
            const [statsRes, sysRes, dbRes] = await Promise.all([
                DashboardApp.apiFetch('/stats').catch(() => null),
                DashboardApp.apiFetch('/admin/system/status').catch(() => null),
                DashboardApp.apiFetch('/admin/database/status').catch(() => null)
            ]);
            
            const statsData = statsRes && statsRes.ok ? await statsRes.json() : null;
            const sysData = sysRes && sysRes.ok ? await sysRes.json() : null;
            const dbData = dbRes && dbRes.ok ? await dbRes.json() : null;
            
            const merged = {
                totalNews: statsData?.totalNews || 0,
                totalUsers: statsData?.totalUsers || 0,
                totalLikes: statsData?.totalLikes || 0,
                totalComments: (statsData?.totalComments || 0) + (statsData?.totalComComments || 0),
                activeLotteries: statsData?.activeLotteries || 0,
                totalParts: statsData?.totalParticipants || 0,
                ticketsSold: statsData?.ticketsSold || 0,
                totalRevenue: statsData?.totalRevenue || 0,
                databaseStatus: dbData?.success ? dbData.data?.status : 'Desconectado',
                uptime: sysData?.success ? sysData.data?.uptime : '--'
            };
            
            this.updateUI(merged);
        } catch (error) {
            console.error('Error fetching stats:', error);
            DashboardApp.showNotification('Error al cargar métricas principales', 'error');
        } finally {
            this.toggleLoader(false);
        }
    },

    updateUI(data) {
        if(this.totalNews) this.totalNews.textContent = data.totalNews;
        if(this.totalUsers) this.totalUsers.textContent = data.totalUsers;
        if(this.totalLikes) this.totalLikes.textContent = data.totalLikes;
        if(this.totalComments) this.totalComments.textContent = data.totalComments;
        if(this.activeLotteries) this.activeLotteries.textContent = data.activeLotteries;
        if(this.totalParts) this.totalParts.textContent = data.totalParts;
        if(this.ticketsSold) this.ticketsSold.textContent = data.ticketsSold;
        if(this.revenue) this.revenue.textContent = '$' + Number(data.totalRevenue).toLocaleString('es-AR', { minimumFractionDigits: 0 });
        
        if(this.dbStatus) {
            this.dbStatus.textContent = data.databaseStatus === 'Conectado' ? 'En Línea' : 'Desconectado';
            this.dbStatus.className = data.databaseStatus === 'Conectado' ? 'text-success fw-bold' : 'text-danger fw-bold';
        }
        
        if(this.uptime) {
             this.uptime.textContent = data.uptime;
        }
    }
};

window.DashboardStats = DashboardStats;
