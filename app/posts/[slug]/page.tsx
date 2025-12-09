/**
 * 文章详情页
 */

// nextDynamic 用于动态加载 EnhancedMarkdown 组件，懒加载
// 避免在服务器端渲染时加载过大依赖
import nextDynamic from 'next/dynamic';
import { supabaseServer } from '../../../lib/supabase';

// dayjs 用于格式化日期,优点是体积小，支持插件扩展
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

export const dynamic = 'force-dynamic';

const EnhancedMarkdown = nextDynamic(() => import('../../../components/EnhancedMarkdown'), { ssr: false });

interface Props { params: { slug: string } }

export default async function PostPage({ params }: Props) {
  const { data, error } = await supabaseServer
    .from('posts')
    .select('id,title,slug,content,excerpt,created_at,updated_at,is_public,published,post_categories(categories(id,name,slug))')
    .eq('slug', params.slug)
    .maybeSingle();
  if (error) return <div className="text-sm text-red-600">加载失败: {error.message}</div>;
  if (!data) return <div className="text-sm text-gray-500">未找到文章</div>;
  const categories = data.post_categories?.map((pc: any) => pc.categories) || [];
  const created = dayjs(data.created_at);
  const updated = dayjs(data.updated_at);
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 space-y-4">
        <h1 className="text-3xl font-bold text-center tracking-tight bg-gradient-to-r from-brand-600 to-brand-400 dark:from-brand-400 dark:to-brand-300 bg-clip-text text-transparent">
          {data.title}
        </h1>
        <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-600 dark:text-neutral-400">
          <div className="flex items-center gap-1">
            <span>发布:</span>
            <time dateTime={created.toISOString()}>{created.format('YYYY-MM-DD')}</time>
            <span className="opacity-60">({created.fromNow()})</span>
          </div>
          <div className="flex items-center gap-1">
            <span>更新:</span>
            <time dateTime={updated.toISOString()}>{updated.format('YYYY-MM-DD')}</time>
            {updated.isAfter(created.add(5, 'minute')) && (
              <span className="opacity-60">({updated.fromNow()})</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {data.published ? (
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">已发布</span>
            ) : (
              <span className="px-2 py-0.5 rounded-md bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/20">草稿</span>
            )}
            {data.is_public ? (
              <span className="px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">公开</span>
            ) : (
              <span className="px-2 py-0.5 rounded-md bg-neutral-500/15 text-neutral-600 dark:text-neutral-300 border border-neutral-500/20">私密</span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((c: any) => (
            <span key={c.id} className="px-2 py-1 rounded-full bg-gradient-to-r from-brand-500/10 to-brand-400/10 dark:from-brand-400/15 dark:to-brand-300/15 text-brand-600 dark:text-brand-300 text-xs border border-brand-500/30 backdrop-blur shadow-sm">
              {c.name}
            </span>
          ))}
        </div>
      </div>
      <EnhancedMarkdown markdown={data.content || ''} />
      <div className="mt-8">
        <a href="/" className="inline-block text-brand-500 hover:underline text-sm">← 返回首页</a>
      </div>
    </div>
  );
}