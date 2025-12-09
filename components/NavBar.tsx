"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { supabaseClient as supabase } from '../lib/supabase';

export default function NavBar() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id || null;
      if (!ignore) setUserId(uid);
      if (uid) {
        const { data } = await supabase
          .from('users')
          .select('is_admin')
          .eq('id', uid)
          .maybeSingle();
        if (!ignore) setIsAdmin(!!data?.is_admin);
      } else if (!ignore) setIsAdmin(false);
    }
    init();
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      const uid = session?.user?.id || null;
      setUserId(uid);
      if (uid) {
        supabase
          .from('users')
          .select('is_admin')
          .eq('id', uid)
          .maybeSingle()
          .then(({ data }) => setIsAdmin(!!data?.is_admin));
      } else setIsAdmin(false);
    });
    return () => { listener.subscription.unsubscribe(); ignore = true; };
  }, []);

  const pathname = usePathname();
  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname?.startsWith(href);
  }
  const links = [
    { href: '/', label: '首页' },
    { href: '/categories', label: '分类' },
    { href: '/posts/new', label: '写文章' },
    { href: '/admin', label: '管理' },
  ];
  return (
    <nav className="flex items-center gap-2 text-sm overflow-x-auto glass px-3 py-2">
      {links.map(l => (
        <Link
          key={l.href}
          href={l.href}
          aria-current={isActive(l.href) ? 'page' : undefined}
          className={`nav-link decoration-none ${isActive(l.href) ? 'text-brand-600 dark:text-brand-300' : ' text-neutral-700 dark:text-neutral-200'}`}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
