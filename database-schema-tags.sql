-- 创建标签表
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#3b82f6', -- 默认蓝色
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建文章标签关联表（多对多）
CREATE TABLE IF NOT EXISTS post_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, tag_id)
);

-- 创建索引以提升查询性能
CREATE INDEX IF NOT EXISTS idx_post_tags_post_id ON post_tags(post_id);
CREATE INDEX IF NOT EXISTS idx_post_tags_tag_id ON post_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_tags_slug ON tags(slug);

-- RLS 策略（行级安全）
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_tags ENABLE ROW LEVEL SECURITY;

-- 标签表：所有人可读，只有管理员可写
CREATE POLICY "Tags are viewable by everyone" ON tags
  FOR SELECT USING (true);

CREATE POLICY "Tags are creatable by admins" ON tags
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.is_admin = true
    )
  );

CREATE POLICY "Tags are updatable by admins" ON tags
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.is_admin = true
    )
  );

CREATE POLICY "Tags are deletable by admins" ON tags
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.is_admin = true
    )
  );

-- 文章标签关联表：所有人可读，只有管理员和作者可写
CREATE POLICY "Post tags are viewable by everyone" ON post_tags
  FOR SELECT USING (true);

CREATE POLICY "Post tags are creatable by admins or post authors" ON post_tags
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.is_admin = true
    ) OR
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = post_tags.post_id AND posts.author_id = auth.uid()
    )
  );

CREATE POLICY "Post tags are deletable by admins or post authors" ON post_tags
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.is_admin = true
    ) OR
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = post_tags.post_id AND posts.author_id = auth.uid()
    )
  );

-- 函数：根据slug获取标签的文章数量
CREATE OR REPLACE FUNCTION get_tag_post_count(tag_slug TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(DISTINCT pt.post_id)
    FROM post_tags pt
    JOIN tags t ON t.id = pt.tag_id
    JOIN posts p ON p.id = pt.post_id
    WHERE t.slug = tag_slug AND p.published = true AND p.is_public = true
  );
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON TABLE tags IS '标签表：用于文章标签管理';
COMMENT ON TABLE post_tags IS '文章标签关联表：多对多关系';
