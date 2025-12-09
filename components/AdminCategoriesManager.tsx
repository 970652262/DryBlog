"use client";
import { useEffect, useState } from 'react';
import { supabaseClient as supabase } from '../lib/supabase';
import { Category } from '../types/category';

export default function AdminCategoriesManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editSlug, setEditSlug] = useState('');

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from('categories').select('*').order('name');
    if (error) { setError(error.message); setLoading(false); return; }
    setCategories(data as Category[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function startEdit(c: Category) {
    setEditingId(c.id);
    setEditName(c.name);
    setEditDesc(c.description || '');
    setEditSlug(c.slug);
  }

  function cancel() {
    setEditingId(null);
    setEditName('');
    setEditDesc('');
    setEditSlug('');
  }

  async function save() {
    if (!editingId) return;
    setBusyId(editingId);
    const { error } = await supabase
      .from('categories')
      .update({ name: editName.trim(), description: editDesc || null, slug: editSlug.trim() })
      .eq('id', editingId);
    if (error) { setError('保存失败: ' + error.message); setBusyId(null); return; }
    setCategories(cs => cs.map(c => c.id === editingId ? { ...c, name: editName.trim(), description: editDesc || null, slug: editSlug.trim() } : c));
    setBusyId(null);
    cancel();
  }

  async function remove(id: string) {
    if (!confirm('确认删除该分类？（相关文章的关联将被删除或置空）')) return;
    setBusyId(id);
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) { setError('删除失败: ' + error.message); setBusyId(null); return; }
    setCategories(cs => cs.filter(c => c.id !== id));
    setBusyId(null);
    if (editingId === id) cancel();
  }

  if (loading) return <div className="text-sm text-gray-500">加载分类...</div>;
  if (error) return <div className="text-sm text-red-600">{error}</div>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">分类管理</h3>
      <ul className="divide-y divide-gray-200">
        {categories.map(c => (
          <li key={c.id} className="py-3 space-y-2">
            {editingId !== c.id && (
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{c.name}</p>
                  <p className="text-xs text-gray-500">slug: {c.slug}</p>
                  {c.description && <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{c.description}</p>}
                </div>
                <div className="flex flex-col gap-1">
                  <button onClick={() => startEdit(c)} className="px-2 py-1 text-xs rounded bg-brand-500 text-white">编辑</button>
                  <button disabled={busyId === c.id} onClick={() => remove(c.id)} className="px-2 py-1 text-xs rounded bg-red-600 text-white disabled:opacity-50">删除</button>
                </div>
              </div>
            )}
            {editingId === c.id && (
              <div className="space-y-2">
                <input value={editName} onChange={e => setEditName(e.target.value)} className="w-full rounded border border-gray-300 px-2 py-1 text-xs" />
                <input value={editSlug} onChange={e => setEditSlug(e.target.value)} className="w-full rounded border border-gray-300 px-2 py-1 text-xs" />
                <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={2} className="w-full rounded border border-gray-300 px-2 py-1 text-xs" />
                <div className="flex items-center gap-2">
                  <button disabled={busyId === c.id} onClick={save} className="px-3 py-1 text-xs rounded bg-brand-600 text-white disabled:opacity-50">保存</button>
                  <button disabled={busyId === c.id} onClick={cancel} className="px-3 py-1 text-xs rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200">取消</button>
                </div>
              </div>
            )}
          </li>
        ))}
        {!categories.length && <li className="py-6 text-center text-sm text-gray-500">暂无分类</li>}
      </ul>
    </div>
  );
}
