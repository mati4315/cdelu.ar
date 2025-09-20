-- Índices recomendados para mejorar consultas comunes

-- Noticias: ordenar por created_at y buscar por created_by
CREATE INDEX IF NOT EXISTS idx_news_created_at ON news (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_created_by ON news (created_by);

-- Likes: búsquedas por (user_id, news_id)
CREATE UNIQUE INDEX IF NOT EXISTS idx_likes_user_news ON likes (user_id, news_id);
CREATE INDEX IF NOT EXISTS idx_likes_news ON likes (news_id);

-- Comments: búsquedas por news_id con orden por created_at
CREATE INDEX IF NOT EXISTS idx_comments_news_created ON comments (news_id, created_at DESC);

-- Users: búsqueda por email
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users (email);


