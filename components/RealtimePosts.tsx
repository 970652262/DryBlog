"use client";
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { supabaseClient as supabase } from '../lib/supabase';
import { Post } from '../types/post';

function formatDate(value: string | null) {
  if (!value) return '';
  // Use UTC normalized format to avoid locale mismatch (browser vs server)
  const d = new Date(value);
  // Format as YYYY-MM-DD HH:mm (24h)
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

function TimeStamp({ value }: { value: string | null }) {
  return <div className="text-xs text-gray-500">{formatDate(value)}</div>;
}

const PAGE_SIZE = 15;
export default function RealtimePosts({ initial, totalCount: initialTotal }: { initial: Post[]; totalCount?: number }) {
  const [posts, setPosts] = useState<Post[]>(initial);
  const [totalCount, setTotalCount] = useState(initialTotal ?? initial.length);
  const [page, setPage] = useState(1); // 1-based
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initial.length === PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // subscribe to insert/update/delete
    const channel = supabase
      .channel('realtime-posts')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts' },
        (payload: any) => {
          const newRecord: Post | null = payload.new as Post | null;
          const oldRecord: Post | null = payload.old as Post | null;
          setPosts(prev => {
            let next = prev.slice();
            switch (payload.eventType) {
              case 'INSERT':
                if (newRecord?.is_public && newRecord?.published) {
                  next = [newRecord, ...next];
                  setTotalCount(c => c + 1);
                }
                break;
              case 'UPDATE':
                if (!newRecord) break;
                const visible = newRecord.is_public && newRecord.published;
                const existed = prev.find(p => p.id === newRecord.id);
                if (visible) {
                  if (existed) {
                    next = next.map(p => p.id === newRecord.id ? newRecord : p);
                  } else {
                    next = [newRecord, ...next];
                    setTotalCount(c => c + 1);
                  }
                } else if (existed) {
                  next = next.filter(p => p.id !== newRecord.id);
                  setTotalCount(c => Math.max(0, c - 1));
                }
                break;
              case 'DELETE':
                if (oldRecord) {
                  next = next.filter(p => p.id !== oldRecord.id);
                  setTotalCount(c => Math.max(0, c - 1));
                }
                break;
            }
            // sort by created_at desc
            return next.sort((a, b) => (new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()));
          });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Infinite scroll
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
    return () => { observer.disconnect(); };
  }, [hasMore, page]);

  // guard flag prevents overlapping
  let pending = false;
  async function loadMore() {
    if (loadingMore || !hasMore) return;
    if (pending) return; // concurrency protection
    pending = true;
    setLoadingMore(true);
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from('posts')
      .select('id,title,slug,excerpt,created_at')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .range(from, to);
    if (!error && data) {
      setPosts(prev => {
        const incoming = data as Post[];
        const existingIds = new Set(prev.map(p => p.id));
        const filtered = incoming.filter(p => !existingIds.has(p.id));
        return [...prev, ...filtered];
      });
      setPage(p => p + 1);
      setHasMore((data as Post[]).length === PAGE_SIZE);
    }
    setLoadingMore(false);
    pending = false;
  }

  return (
    <div className="space-y-4">
      {/* <div className="text-xs text-gray-500 flex justify-end items-end">当前显示 {posts.length} / 总计 {totalCount} 篇</div> */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.slice(0, page * PAGE_SIZE).map((p) => (
          <div
            key={p.id}
            className="group rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col h-full"
          >
            {/* 标题 - 固定在顶部，2行，超出显示省略号 */}
            <Link href={`/posts/${p.slug}`} className="decoration-none">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-brand-500 dark:group-hover:text-brand-400 transition-colors mb-3 line-clamp-2 min-h-[3.5rem]">
                {p.title}
              </h3>
            </Link>

            {/* 摘要 - 中间部分，2行，超出显示省略号，flex-1 占据剩余空间 */}
            <div className="flex-1 mb-4">
              {p.excerpt ? (
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {p.excerpt}
                </p>
              ) : (
                <p className="text-sm text-gray-400 dark:text-gray-500 italic line-clamp-2">
                  暂无摘要
                </p>
              )}
            </div>

            {/* 日期和"阅读更多" - 固定在底部 */}
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-100 dark:border-gray-800">
              <TimeStamp value={p.created_at} />
              <span className="group-hover:text-brand-500 dark:group-hover:text-brand-400 transition-colors flex items-center gap-1">
                阅读更多 →
              </span>
            </div>
          </div>
        ))}
        {!posts.length && (
          <div className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
            暂无文章
          </div>
        )}
      </div>
      {hasMore && (
        <div className="flex justify-center">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="px-4 py-2 text-sm rounded bg-brand-600 hover:bg-brand-500 text-white disabled:opacity-50"
          >{loadingMore ? '加载中...' : '加载更多'}</button>
        </div>
      )}
      {/* sentinel for infinite scroll */}
      {hasMore && <div ref={sentinelRef} className="h-2" />}
    </div>
  );
}
