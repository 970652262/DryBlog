"use client";
import { useEffect, useState } from 'react';
import { supabaseClient as supabase } from '../lib/supabase';
import Link from 'next/link';

interface SessionUser { id: string; email?: string | null }

export default function AuthControls() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!ignore) {
        setUser(session?.user ?? null);
        setLoading(false);
      }
      if (session?.user?.id) {
        const { data } = await supabase
          .from('users')
          .select('is_admin')
          .eq('id', session.user.id)
          .maybeSingle();
        if (!ignore) setIsAdmin(!!data?.is_admin);
      } else {
        if (!ignore) setIsAdmin(false);
      }
    }
    load();
    const { data: listener } = supabase.auth.onAuthStateChange((
      _event: string,
      session: { user: SessionUser } | null
    ) => {
      setUser(session?.user ?? null);
      if (session?.user?.id) {
        supabase
          .from('users')
          .select('is_admin')
          .eq('id', session.user.id)
          .maybeSingle()
          .then(({ data }) => { setIsAdmin(!!data?.is_admin); });
      } else {
        setIsAdmin(false);
      }
    });
    return () => { ignore = true; listener.subscription.unsubscribe(); };
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  if (loading) return <div className="text-xs text-gray-500">加载中...</div>;

  if (!user) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <Link href="/login" className="text-brand-500 hover:underline">登录/注册</Link>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="text-gray-700">{user.email}</span>
      {/* <Link href="/posts/new" className="text-brand-500 hover:underline">写文章</Link> */}
      {isAdmin && <Link href="/admin" className="text-brand-500 hover:underline">后台</Link>}
      <button onClick={handleLogout} className="text-white-500 hover:text-brand-100 transition-colors">退出</button>
      {error && <span className="text-red-600">{error}</span>}
    </div>
  );
}