import Link from 'next/link';
import { Post } from '../types/post';
import RealtimePosts from '../components/RealtimePosts';
import VirtualizedPostList from '../components/VirtualizedPostList';
import { createAuthedServerClient } from '../lib/supabaseServerRls';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export default async function Home() {
  try {
    const supabase = createAuthedServerClient();
    const { data: userRes } = await supabase.auth.getUser();
    const userId = userRes?.user?.id;
    let isAdmin = false;
    if (userId) {
      const { data: profile } = await supabase.from('users').select('is_admin').eq('id', userId).maybeSingle();
      isAdmin = !!profile?.is_admin;
    }
    const base = supabase
      .from('posts')
      .select('id,title,slug,excerpt,created_at,published,is_public', { count: 'exact' })
      .order('created_at', { ascending: false });
    const query = isAdmin ? base : base.eq('is_public', true).eq('published', true);
    const { data, error, count } = await query.range(0, 14); // first 15
    if (error) {
      return (
        <main className="space-y-4">
          <div className="text-red-600 text-sm font-medium">加载失败: {error.message}</div>
          <pre className="text-xs text-gray-500">(服务器查询失败)</pre>
          <p className="text-xs text-gray-600">检查 RLS 是否有 public read 策略，或确认 is_public=true。</p>
        </main>
      );
    }
  const posts = data as Post[] | null;
  const emptyPublic = !isAdmin && (count ?? 0) === 0;
    return (
      <main className="space-y-6 surface p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">文章列表</h2>
          <span className="text-xs text-gray-500">共 {count ?? posts?.length ?? 0} 篇</span>
        </div>
        {emptyPublic && (
          <div className="rounded border border-amber-300 bg-amber-50 p-3 text-xs text-amber-700 space-y-1">
            <p>没有公开已发布文章。</p>
            <p>请确认：1) 新文章 published=TRUE & is_public=TRUE；2) posts 公共 SELECT 策略允许条件；3) 列名与策略一致。</p>
          </div>
        )}
        <RealtimePosts initial={posts || []} totalCount={count ?? posts?.length ?? 0} />
      </main>
    );
  } catch (e: any) {
    return (
      <main className="space-y-4">
        <div className="text-red-600 text-sm font-medium">加载失败: {e?.message || String(e)}</div>
        <pre className="text-xs text-gray-500">(服务器异常)</pre>
      </main>
    );
  }
}