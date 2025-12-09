"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Virtuoso } from 'react-virtuoso';
import { supabaseClient as supabase } from '../lib/supabase';
import { Post } from '../types/post';
import { PostCardSkeleton } from './SkeletonLoading';

function formatDate(value: string | null) {
  if (!value) return '';
  const d = new Date(value);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

interface VirtualizedPostListProps {
  initial: Post[];
  totalCount: number;
  isAdmin?: boolean;
}

export default function VirtualizedPostList({ initial, totalCount, isAdmin = false }: VirtualizedPostListProps) {
  const [posts, setPosts] = useState<Post[]>(initial);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 实时订阅文章变化
    const channel = supabase
      .channel('realtime-posts-virtualized')
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
                if (newRecord && (isAdmin || (newRecord.is_public && newRecord.published))) {
                  next = [newRecord, ...next];
                }
                break;
              case 'UPDATE':
                if (!newRecord) break;
                const visible = isAdmin || (newRecord.is_public && newRecord.published);
                const existed = prev.find(p => p.id === newRecord.id);
                if (visible) {
                  if (existed) {
                    next = next.map(p => p.id === newRecord.id ? newRecord : p);
                  } else {
                    next = [newRecord, ...next];
                  }
                } else if (existed) {
                  next = next.filter(p => p.id !== newRecord.id);
                }
                break;
              case 'DELETE':
                if (oldRecord) {
                  next = next.filter(p => p.id !== oldRecord.id);
                }
                break;
            }
            return next.sort((a, b) => (
              new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
            ));
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);

  // 加载更多数据
  const loadMore = async () => {
    if (loading || posts.length >= totalCount) return;

    setLoading(true);
    const from = posts.length;
    const to = from + 14; // 每次加载15条

    const query = supabase
      .from('posts')
      .select('id,title,slug,excerpt,created_at,published,is_public')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (!isAdmin) {
      query.eq('is_public', true).eq('published', true);
    }

    const { data, error } = await query;

    if (!error && data) {
      setPosts(prev => {
        const incoming = data as Post[];
        const existingIds = new Set(prev.map(p => p.id));
        const filtered = incoming.filter(p => !existingIds.has(p.id));
        return [...prev, ...filtered];
      });
    }

    setLoading(false);
  };

  const PostCard = ({ post }: { post: Post }) => (
    <div className="group rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
      {/* 标题 - 固定在顶部，2行，超出显示省略号 */}
      <Link href={`/posts/${post.slug}`} className="decoration-none">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-brand-500 dark:group-hover:text-brand-400 transition-colors mb-3 line-clamp-2 min-h-[3.5rem]">
          {post.title}
        </h3>
      </Link>

      {/* 摘要 - 中间部分，2行，超出显示省略号，flex-1 占据剩余空间 */}
      <div className="flex-1 mb-4">
        {post.excerpt ? (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {post.excerpt}
          </p>
        ) : (
          <p className="text-sm text-gray-400 dark:text-gray-500 italic line-clamp-2">
            暂无摘要
          </p>
        )}
      </div>

      {/* 日期和"阅读更多" - 固定在底部 */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-100 dark:border-gray-800">
        <span>{formatDate(post.created_at)}</span>
        <span className="group-hover:text-brand-500 dark:group-hover:text-brand-400 transition-colors flex items-center gap-1">
          阅读更多 →
        </span>
      </div>
    </div>
  );

  // 只在文章数量超过50时使用虚拟滚动
  if (totalCount <= 50) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
        {posts.length === 0 && (
          <div className="col-span-full py-12 text-center text-sm text-gray-500 dark:text-gray-400">
            暂无文章
          </div>
        )}
      </div>
    );
  }

  // 使用虚拟滚动
  return (
    <Virtuoso
      style={{ height: '800px' }}
      data={posts}
      endReached={loadMore}
      overscan={200}
      itemContent={(index, post) => (
        <div className="p-3" key={post.id}>
          <PostCard post={post} />
        </div>
      )}
      components={{
        Footer: () => loading ? (
          <div className="p-4 text-center text-sm text-gray-500">
            加载中...
          </div>
        ) : null
      }}
    />
  );
}
