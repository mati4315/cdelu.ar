const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const pool = require('../config/database');
const dotenv = require('dotenv');

dotenv.config();

class BackupService {
  constructor() {
    this.backupDir = 'D:\\WEB MATER\\cdelu.ar\\base de datos';
    this.mysqldumpPath = 'd:\\Archivos de programas\\xampp2\\mysql\\bin\\mysqldump.exe';
    this.intervalId = null;
    this.intervalMs = 2 * 60 * 60 * 1000; // 2 horas
  }

  async ensureSettingsTable() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_settings (
        ` + '`key`' + ` VARCHAR(100) PRIMARY KEY,
        ` + '`value`' + ` TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
  }

  async getSetting(key, defaultValue) {
    try {
      const [rows] = await pool.query('SELECT `value` FROM admin_settings WHERE `key` = ?', [key]);
      if (rows.length > 0) return rows[0].value;
      return defaultValue;
    } catch (error) {
      console.error(`Error getting setting ${key}:`, error);
      return defaultValue;
    }
  }

  async saveSetting(key, value) {
    try {
      await pool.query(
        'INSERT INTO admin_settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)',
        [key, String(value)]
      );
    } catch (error) {
      console.error(`Error saving setting ${key}:`, error);
    }
  }

  async runBackup() {
    return new Promise((resolve, reject) => {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `backup_${timestamp}.sql`;
      const outputPath = path.join(this.backupDir, filename);

      const dbHost = process.env.DB_HOST || 'localhost';
      const dbUser = process.env.DB_USER || 'root';
      const dbPass = process.env.DB_PASSWORD || '';
      const dbName = process.env.DB_NAME || 'trigamer_diario';

      // Construir comando mysqldump
      // --triggers --routines --events para backup completo
      let command = `"${this.mysqldumpPath}" -u ${dbUser} -h ${dbHost} --triggers --routines --events ${dbName} > "${outputPath}"`;
      
      if (dbPass) {
        // Nota: poner el password directamente en el comando no es lo más seguro, 
        // pero para este entorno controlado es funcional.
        command = `"${this.mysqldumpPath}" -u ${dbUser} -p${dbPass} -h ${dbHost} --triggers --routines --events ${dbName} > "${outputPath}"`;
      }

      console.log(`[BackupService] Ejecutando: ${command}`);

      exec(command, async (error, stdout, stderr) => {
        if (error) {
          console.error(`[BackupService] Error en backup: ${error.message}`);
          return reject(error);
        }
        
        console.log(`[BackupService] Backup guardado en: ${outputPath}`);
        await this.saveSetting('last_backup_time', new Date().toISOString());
        resolve({ filename, path: outputPath, size: fs.statSync(outputPath).size });
      });
    });
  }

  async init() {
    await this.ensureSettingsTable();
    const autoEnabled = await this.getSetting('auto_backup_enabled', 'false');
    
    if (autoEnabled === 'true') {
      this.startScheduler();
    } else {
      console.log('[BackupService] Respaldo automático deshabilitado.');
    }
  }

  startScheduler() {
    if (this.intervalId) clearInterval(this.intervalId);
    
    console.log('[BackupService] Iniciador de respaldo automático cada 2 horas activo.');
    this.intervalId = setInterval(async () => {
      try {
        console.log('[BackupService] Iniciando respaldo automático programado...');
        await this.runBackup();
      } catch (error) {
        console.error('[BackupService] Falló el respaldo automático:', error);
      }
    }, this.intervalMs);
    
    this.saveSetting('auto_backup_enabled', 'true');
  }

  stopScheduler() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log('[BackupService] Respaldo automático detenido.');
    this.saveSetting('auto_backup_enabled', 'false');
  }

  async getStatus() {
    const enabled = await this.getSetting('auto_backup_enabled', 'false');
    const lastTime = await this.getSetting('last_backup_time', 'Nunca');
    return {
      auto_backup_enabled: enabled === 'true',
      last_backup_time: lastTime,
      backup_dir: this.backupDir
    };
  }
}

module.exports = new BackupService();
