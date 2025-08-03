const pool = require('../config/database');

/**
 * Worker para gestionar automáticamente anuncios de lotería
 * Se ejecuta cada 5 minutos para verificar loterías activas y crear/actualizar anuncios
 */
class LotteryAdWorker {
    
    /**
     * Verificar loterías activas en ejecución
     */
    async checkActiveLotteries() {
        try {
            const [lotteries] = await pool.execute(`
                SELECT 
                    l.*,
                    CASE 
                        WHEN l.status = 'active' AND NOW() > l.end_date THEN 'overdue'
                        WHEN l.status = 'active' AND NOW() BETWEEN l.start_date AND l.end_date THEN 'running'
                        WHEN l.status = 'active' AND NOW() < l.start_date THEN 'pending'
                        ELSE l.status
                    END as current_status
                FROM lotteries l
                WHERE l.status = 'active'
                ORDER BY l.created_at DESC
            `);
            
            // Filtrar solo loterías que están realmente en ejecución
            const activeLotteries = lotteries.filter(lottery => 
                lottery.status === 'active' && lottery.current_status === 'running'
            );
            
            console.log(`🎰 LotteryAdWorker: ${activeLotteries.length} loterías activas encontradas`);
            
            return activeLotteries;
        } catch (error) {
            console.error('❌ Error verificando loterías activas:', error);
            return [];
        }
    }
    
    /**
     * Crear o actualizar anuncio de lotería
     */
    async manageLotteryAd(activeLotteries) {
        try {
            // Buscar anuncio de lotería existente
            const [existingAds] = await pool.execute(`
                SELECT * FROM ads 
                WHERE titulo LIKE '%🎰%' AND categoria = 'eventos'
                ORDER BY created_at DESC 
                LIMIT 1
            `);
            
            const lotteryAdData = {
                titulo: "🎰 ¡Loterías Activas!",
                descripcion: `¡Participa en nuestras loterías activas! Tenemos ${activeLotteries.length} lotería${activeLotteries.length > 1 ? 's' : ''} en ejecución con premios increíbles. ¡No te pierdas la oportunidad de ganar!`,
                enlace_destino: "/lottery.html",
                texto_opcional: `Anuncio dinámico - ${activeLotteries.length} lotería${activeLotteries.length > 1 ? 's' : ''} activa${activeLotteries.length > 1 ? 's' : ''}`,
                categoria: "eventos",
                prioridad: 3,
                activo: activeLotteries.length > 0, // Solo activo si hay loterías
                impresiones_maximas: 0
            };
            
            if (existingAds.length > 0) {
                // Actualizar anuncio existente
                const existingAd = existingAds[0];
                
                await pool.execute(`
                    UPDATE ads 
                    SET 
                        titulo = ?,
                        descripcion = ?,
                        enlace_destino = ?,
                        texto_opcional = ?,
                        prioridad = ?,
                        activo = ?,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                `, [
                    lotteryAdData.titulo,
                    lotteryAdData.descripcion,
                    lotteryAdData.enlace_destino,
                    lotteryAdData.texto_opcional,
                    lotteryAdData.prioridad,
                    lotteryAdData.activo ? 1 : 0,
                    existingAd.id
                ]);
                
                console.log(`🔄 LotteryAdWorker: Anuncio de lotería actualizado (ID: ${existingAd.id})`);
                console.log(`📊 Estado: ${activeLotteries.length > 0 ? 'ACTIVO' : 'INACTIVO'}`);
                
                return existingAd.id;
            } else {
                // Crear nuevo anuncio
                const [result] = await pool.execute(`
                    INSERT INTO ads (
                        titulo, descripcion, enlace_destino, texto_opcional,
                        categoria, prioridad, activo, impresiones_maximas
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    lotteryAdData.titulo,
                    lotteryAdData.descripcion,
                    lotteryAdData.enlace_destino,
                    lotteryAdData.texto_opcional,
                    lotteryAdData.categoria,
                    lotteryAdData.prioridad,
                    lotteryAdData.activo ? 1 : 0,
                    lotteryAdData.impresiones_maximas
                ]);
                
                console.log(`🆕 LotteryAdWorker: Nuevo anuncio de lotería creado (ID: ${result.insertId})`);
                console.log(`📊 Estado: ${activeLotteries.length > 0 ? 'ACTIVO' : 'INACTIVO'}`);
                
                return result.insertId;
            }
            
        } catch (error) {
            console.error('❌ Error gestionando anuncio de lotería:', error);
            return null;
        }
    }
    
    /**
     * Ejecutar el worker
     */
    async run() {
        try {
            console.log('🚀 LotteryAdWorker: Iniciando verificación...');
            
            // 1. Verificar loterías activas
            const activeLotteries = await this.checkActiveLotteries();
            
            // 2. Gestionar anuncio
            const adId = await this.manageLotteryAd(activeLotteries);
            
            if (adId) {
                console.log(`✅ LotteryAdWorker: Proceso completado - Anuncio ID: ${adId}`);
            } else {
                console.log('⚠️ LotteryAdWorker: No se pudo gestionar el anuncio');
            }
            
        } catch (error) {
            console.error('❌ Error en LotteryAdWorker:', error);
        }
    }
    
    /**
     * Iniciar worker en modo automático
     */
    startAutoMode(intervalMinutes = 5) {
        console.log(`🔄 LotteryAdWorker: Iniciando modo automático (cada ${intervalMinutes} minutos)`);
        
        // Ejecutar inmediatamente
        this.run();
        
        // Ejecutar cada X minutos
        const intervalMs = intervalMinutes * 60 * 1000;
        setInterval(() => {
            this.run();
        }, intervalMs);
    }
}

// Exportar para uso en otros módulos
module.exports = LotteryAdWorker;

// Si se ejecuta directamente, iniciar en modo automático
if (require.main === module) {
    const worker = new LotteryAdWorker();
    worker.startAutoMode();
} 