module.exports = {
  port: process.env.PORT || 3001,
  db: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'cdelu_db'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'tu_secreto_super_seguro',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d'
  },
  deepseek: {
    apiKey: process.env.DEEPSEEK_API_KEY || ''
  },
  rss: {
    feedUrl: process.env.RSS_FEED_URL || 'https://lapiramide.net/feed'
  },
  // Orígenes permitidos para CORS (para helmet CSP y cors plugin)
  // Si está configurado como '*', aceptar cualquier origen
  get corsOrigin() {
    const origin = process.env.CORS_ORIGIN || 'http://localhost:3001';
    return origin === '*' ? true : origin;
  }
}; 