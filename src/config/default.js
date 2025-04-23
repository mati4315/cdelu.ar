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
    expiresIn: '1d'
  },
  deepseek: {
    apiKey: process.env.DEEPSEEK_API_KEY || ''
  },
  rss: {
    feedUrl: process.env.RSS_FEED_URL || 'https://lapiramide.net/feed'
  }
}; 