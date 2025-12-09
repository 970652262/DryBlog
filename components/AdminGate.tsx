"use client";
import { useEffect, useState } from 'react';
import { supabaseClient as supabase } from '../lib/supabase';

interface Props { children: React.ReactNode }

export default function AdminGate({ children }: Props) {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    async function check() {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (!uid) { if (!ignore) { setLoading(false); setIsAdmin(false); } return; }
      const { data, error } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', uid)
        .maybeSingle();
      if (error && error.code !== 'PGRST116') { 
        if (!ignore) setError(error.message);
      }
      if (!ignore) {
  setIsAdmin(!!data?.is_admin);
        setLoading(false);
      }
    }
    check();
    return () => { ignore = true; };
  }, []);

  if (loading) return <div className="text-sm text-gray-500">加载中，稍等一下下子...</div>;
  if (error) return <div className="text-sm text-red-600">加载权限失败: {error}</div>;
  if (!isAdmin) return <div className="text-sm text-gray-600">未授权访问。</div>;
  return <>{children}</>;
}
