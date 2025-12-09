export interface Tag {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  color?: string;
  created_at: string | null;
}

export interface PostTag {
  id: string;
  post_id: string;
  tag_id: string;
  created_at: string | null;
}

export interface TagWithCount extends Tag {
  post_count?: number;
}
