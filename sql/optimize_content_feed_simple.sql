-- Optimización de triggers para content_feed (sin DELIMITER)

-- Eliminar triggers existentes
DROP TRIGGER IF EXISTS after_likes_insert;
DROP TRIGGER IF EXISTS after_likes_delete;
DROP TRIGGER IF EXISTS after_com_likes_insert;
DROP TRIGGER IF EXISTS after_com_likes_delete;
DROP TRIGGER IF EXISTS after_comments_insert;
DROP TRIGGER IF EXISTS after_comments_delete;
DROP TRIGGER IF EXISTS after_com_comments_insert;
DROP TRIGGER IF EXISTS after_com_comments_delete;

-- Recalcular contadores existentes para noticias (likes)
UPDATE content_feed cf
SET likes_count = (
  SELECT COALESCE(COUNT(*), 0) 
  FROM likes l 
  WHERE l.news_id = cf.original_id
)
WHERE cf.type = 1;

-- Recalcular contadores existentes para comunidad (likes)
UPDATE content_feed cf
SET likes_count = (
  SELECT COALESCE(COUNT(*), 0) 
  FROM com_likes cl 
  WHERE cl.com_id = cf.original_id
)
WHERE cf.type = 2;

-- Recalcular contadores existentes para noticias (comments)
UPDATE content_feed cf
SET comments_count = (
  SELECT COALESCE(COUNT(*), 0) 
  FROM comments c 
  WHERE c.news_id = cf.original_id
)
WHERE cf.type = 1;

-- Recalcular contadores existentes para comunidad (comments)
UPDATE content_feed cf
SET comments_count = (
  SELECT COALESCE(COUNT(*), 0) 
  FROM com_comments cc 
  WHERE cc.com_id = cf.original_id
)
WHERE cf.type = 2;
