export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  author_id: string;
  category_id?: string | null;
  published: boolean | null;
  is_public: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

// 扩展类型：包含通过 post_categories 关联的分类
export interface PostWithCategories extends Post {
  post_categories?: { categories: { id: string; name: string; slug: string } }[];
}

// 扩展类型：包含标签
export interface PostWithTags extends Post {
  post_tags?: { tags: { id: string; name: string; slug: string; color?: string } }[];
}

// 扩展类型：同时包含分类和标签
export interface PostWithCategoriesAndTags extends PostWithCategories {
  post_tags?: { tags: { id: string; name: string; slug: string; color?: string } }[];
}
