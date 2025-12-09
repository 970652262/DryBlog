"use client";
import AdminGate from '../../components/AdminGate';
import nextDynamic from 'next/dynamic';

const AdminPostsManager = nextDynamic(() => import('../../components/AdminPostsManager'), { ssr: false });
const AdminCategoriesManager = nextDynamic(() => import('../../components/AdminCategoriesManager'), { ssr: false });

export const dynamic = 'force-dynamic';

export default function AdminPage() {
  return (
    <main className="space-y-6 surface p-6">
      <h2 className="text-xl font-semibold">管理员后台</h2>
      {/* 检查是否有管理员权限 */}
      <AdminGate>
        <AdminDashboard />
      </AdminGate>
    </main>
  );
}

function AdminDashboard() {
  return <Tabs />;
}

import { useState } from 'react';

function Tabs() {
  const [tab, setTab] = useState<'posts' | 'categories'>('posts');
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button onClick={() => setTab('posts')} className={`px-3 py-1 text-xs rounded ${tab==='posts' ? 'bg-brand-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}>文章</button>
        <button onClick={() => setTab('categories')} className={`px-3 py-1 text-xs rounded ${tab==='categories' ? 'bg-brand-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}>分类</button>
      </div>
      {tab === 'posts' && <AdminPostsManager />}
      {tab === 'categories' && <AdminCategoriesManager />}
    </div>
  );
}
