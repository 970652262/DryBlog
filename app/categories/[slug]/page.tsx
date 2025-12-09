import { supabaseServer } from '../../../lib/supabase';
import Link from 'next/link';
import { PostWithCategories } from '../../../types/post';
import { Category } from '../../../types/category';
import { ArrowLeft } from 'lucide-react';

interface Props { params: { slug: string } }
export const dynamic = 'force-dynamic';

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

export default async function CategoryPage({ params }: Props) {
  const { data: catData, error: catError } = await supabaseServer
    .from('categories')
    .select('*')
    .eq('slug', params.slug)
    .single();
  if (catError) return <main className="text-sm text-red-600">分类加载失败: {catError.message}</main>;
  const category = catData as Category | null;
  if (!category) return <main className="text-sm text-gray-500">未找到该分类</main>;

  const { data: postsData, error: postsError } = await supabaseServer
    .from('post_categories')
    .select('posts(id,title,slug,excerpt,created_at,published,is_public)')
    .eq('category_id', category.id);
  if (postsError) return <main className="text-sm text-red-600">文章加载失败: {postsError.message}</main>;
  // postsData: array of { posts: {...} }
  const posts = (postsData as any[])
    .map(r => r.posts)
    .filter(Boolean)
    .filter(p => p.is_public && p.published) as PostWithCategories[];

  return (
    <main className="space-y-6">
      {/* 顶部标题区域 */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Link
              href="/categories"
              className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-400 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              返回分类列表
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {category.name}
          </h1>
          {category.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{category.description}</p>
          )}
          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">{category.slug}</span>
            <span>{posts.length} 篇文章</span>
          </div>
        </div>
      </div>

      {/* 文章卡片网格 */}
      {posts.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map(p => (
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
                <span>{formatDate(p.created_at)}</span>
                <span className="group-hover:text-brand-500 dark:group-hover:text-brand-400 transition-colors flex items-center gap-1">
                  阅读更多 →
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">该分类暂无已发布的文章</p>
        </div>
      )}
    </main>
  );
}
