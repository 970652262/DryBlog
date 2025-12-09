import { supabaseServer } from '../../lib/supabase';
import Link from 'next/link';
import { Category } from '../../types/category';
import RealtimeCategories from '../../components/RealtimeCategories';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export default async function CategoriesPage() {
  const { data, error, count } = await supabaseServer
    .from('categories')
    .select('id,name,slug,description,created_at', { count: 'exact' })
    .order('name', { ascending: true })
    .range(0, 14);
  if (error) return <main className="text-sm text-red-600">加载分类失败: {error.message}</main>;
  const categories = data as Category[];
  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">分类</h2>
        <span className="text-xs text-gray-500">共 {count ?? categories.length} 个</span>
      </div>
      <RealtimeCategories initial={categories} totalCount={count ?? categories.length} />
    </main>
  );
}
