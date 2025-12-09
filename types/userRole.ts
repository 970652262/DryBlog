export interface UserRole {
  user_id: string;
  role: string; // e.g. 'admin'
  created_at?: string | null;
}

export const ADMIN_ROLE = 'admin';