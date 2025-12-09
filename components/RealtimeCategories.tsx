"use client";
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { supabaseClient as supabase } from '../lib/supabase';
import { Category } from '../types/category';
import { FileText } from 'lucide-react';

interface CategoryWithCount extends Category {
  post_count?: number;
}

const PAGE_SIZE = 15;
export default function RealtimeCategories({ initial, totalCount: initialTotal }: { initial: Category[]; totalCount?: number }) {
  const [categories, setCategories] = useState<CategoryWithCount[]>(initial);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initial.length === PAGE_SIZE);
  const [totalCount, setTotalCount] = useState(initialTotal ?? initial.length);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // 获取每个分类的文章数量
  useEffect(() => {
    async function fetchPostCounts() {
      const categoryIds = categories.map(c => c.id);
      if (categoryIds.length === 0) return;

      const { data } = await supabase
        .from('post_categories')
        .select('category_id')
        .in('category_id', categoryIds);

      if (data) {
        const counts: Record<string, number> = {};
        data.forEach((pc: any) => {
          counts[pc.category_id] = (counts[pc.category_id] || 0) + 1;
        });

        setCategories(prev => prev.map(c => ({
          ...c,
          post_count: counts[c.id] || 0
        })));
      }
    }

    fetchPostCounts();
  }, [categories.length]);

  useEffect(() => {
    const channel = supabase
      .channel('realtime-categories')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, (payload: any) => {
        const newRecord: Category | null = payload.new as Category | null;
        const oldRecord: Category | null = payload.old as Category | null;
        setCategories(prev => {
          let next = prev.slice();
          switch (payload.eventType) {
            case 'INSERT':
              if (newRecord) {
                // Avoid duplicates
                if (!next.find(c => c.id === newRecord.id)) {
                  next = [...next, newRecord];
                  setTotalCount(c => c + 1);
                }
              }
              break;
            case 'UPDATE':
              if (newRecord) next = next.map(c => c.id === newRecord.id ? { ...newRecord, post_count: c.post_count } : c);
              break;
            case 'DELETE':
              if (oldRecord) {
                next = next.filter(c => c.id !== oldRecord.id);
                setTotalCount(c => Math.max(0, c - 1));
              }
              break;
          }
          return next.sort((a, b) => a.name.localeCompare(b.name));
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Infinite scroll sentinel
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          loadMore();
        }
      });
    }, { rootMargin: '200px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, page]);

  let pending = false;
  async function loadMore() {
    if (loadingMore || !hasMore) return;
    if (pending) return;
    pending = true;
    setLoadingMore(true);
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from('categories')
      .select('id,name,slug,description,created_at')
      .order('name', { ascending: true })
      .range(from, to);
    if (!error && data) {
      setCategories(prev => {
        const incoming = data as Category[];
        const existingIds = new Set(prev.map(c => c.id));
        const filtered = incoming.filter(c => !existingIds.has(c.id));
        return [...prev, ...filtered].sort((a, b) => a.name.localeCompare(b.name));
      });
      setPage(p => p + 1);
      setHasMore((data as Category[]).length === PAGE_SIZE);
    }
    setLoadingMore(false);
    pending = false;
  }

  return (
    <div className="space-y-4">
      <div className="text-xs text-gray-500">当前显示 {categories.length} / 总计 {totalCount}</div>
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {categories.slice(0, page * PAGE_SIZE).map(c => (
          <li key={c.id} className="group rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col">
            <Link href={`/categories/${c.slug}`} className="flex flex-col h-full">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-brand-500 dark:group-hover:text-brand-400 transition-colors mb-2">
                  {c.name}
                </h3>
                {c.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                    {c.description}
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-100 dark:border-gray-800">
                <span className="text-gray-400 dark:text-gray-500">{c.slug}</span>
                <span className="flex items-center gap-1 group-hover:text-brand-500 dark:group-hover:text-brand-400 transition-colors">
                  <FileText className="w-3.5 h-3.5" />
                  <span>{c.post_count ?? 0} 篇</span>
                </span>
              </div>
            </Link>
          </li>
        ))}
        {!categories.length && <li className="text-sm text-gray-500">暂无分类</li>}
      </ul>
      {hasMore && (
        <div className="flex justify-center">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="px-4 py-2 text-sm rounded bg-brand-600 hover:bg-brand-500 text-white disabled:opacity-50"
          >{loadingMore ? '加载中...' : '加载更多'}</button>
        </div>
      )}
      {hasMore && <div ref={sentinelRef} className="h-2" />}
    </div>
  );
}
