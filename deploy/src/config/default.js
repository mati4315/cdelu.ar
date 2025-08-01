module.exports = {
  port: process.env.PORT || 3001,
  db: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'trigamer_diario'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'tu_secreto_super_seguro',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d'
  },
  deepseek: {
    apiKey: process.env.DEEPSEEK_API_KEY || ''
  },
  rss: {
    feedUrl: process.env.RSS_FEED_URL || 'https://lapiramide.net/feed',
    enabled: process.env.RSS_ENABLED !== 'false',
    intervalMinutes: parseInt(process.env.RSS_INTERVAL_MINUTES) || 360 // 6 horas por defecto
  },
  // Orígenes permitidos para CORS (para helmet CSP y cors plugin)
  get corsOrigin() {
    const origin = process.env.CORS_ORIGIN;
    
    // Si está configurado en variable de entorno, usarlo
    if (origin) {
      return origin === '*' ? true : origin.split(',').map(o => o.trim());
    }
    
    // Configuración por defecto según entorno
    if (process.env.NODE_ENV === 'production') {
      return [
        'https://trigamer.xyz',
        'https://www.trigamer.xyz',
        'https://diario.trigamer.xyz',
        'https://www.diario.trigamer.xyz',
        // Apps móviles (Android/iOS) - permitir todos los orígenes
        '*'
      ];
    } else {
      return [
        'http://localhost:3000',
        'http://localhost:3001', 
        'http://localhost:5173',
        'http://localhost:8080',
        // Apps móviles en desarrollo
        '*'
      ];
    }
  }
}; 