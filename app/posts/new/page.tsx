'use client';
import { useState, FormEvent, useEffect } from 'react';
import { supabaseClient as supabase } from '../../../lib/supabase';
import { Post } from '../../../types/post';
import { Category } from '../../../types/category';
import { useAutoSave } from '../../../hooks/useAutoSave';
import dynamic from 'next/dynamic';
import { Save, Clock } from 'lucide-react';

// 动态加载组件
const MarkdownEditor = dynamic(() => import('../../../components/MarkdownEditor'), { ssr: false });
const TagSelector = dynamic(() => import('../../../components/TagSelector'), { ssr: false });

export default function NewPost() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isDraft, setIsDraft] = useState(true);
  const [loading, setLoading] = useState(false);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);

  // 分类创建
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [creatingCat, setCreatingCat] = useState(false);
  const [catError, setCatError] = useState<string | null>(null);

  const [sessionUserId, setSessionUserId] = useState<string | null>(null);

  // 自动保存功能
  const { isSaving, lastSaved, debouncedSave } = useAutoSave({
    delay: 5000, // 5秒后自动保存
    enabled: !!sessionUserId && !!title.trim(),
    onSave: async () => {
      await saveDraft();
    }
  });

  useEffect(() => {
    let ignore = false;
    supabase.auth.getSession().then(({ data }: { data: { session: { user: { id: string } } | null } }) => {
      const { session } = data;
      if (!ignore) setSessionUserId(session?.user.id ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((
      _event: string,
      session: { user: { id: string } } | null
    ) => {
      setSessionUserId(session?.user.id ?? null);
    });
    supabase.from('categories').select('*').order('name', { ascending: true }).then(({ data }) => {
      if (!ignore && data) setCategories(data as Category[]);
    });
    return () => { listener.subscription.unsubscribe(); ignore = true; };
  }, []);

  // 监听内容变化，触发自动保存
  useEffect(() => {
    if (title || content) {
      debouncedSave({ title, content, excerpt });
    }
  }, [title, content, excerpt]);

  // 保存草稿函数
  async function saveDraft() {
    if (!sessionUserId || !title.trim()) return;

    try {
      if (draftId) {
        // 更新现有草稿
        await supabase
          .from('posts')
          .update({
            title,
            content,
            excerpt: excerpt || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', draftId);
      } else {
        // 创建新草稿
        const { data, error } = await supabase
          .from('posts')
          .insert({
            title,
            content,
            excerpt: excerpt || null,
            author_id: sessionUserId,
            is_public: false,
            published: false
          })
          .select()
          .single();

        if (!error && data) {
          setDraftId(data.id);
        }
      }
    } catch (error) {
      console.error('自动保存失败:', error);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    if (!sessionUserId) {
      setLoading(false);
      setMsg('请先登录');
      return;
    }

    let postId = draftId;
    let inserted: Post | null = null;

    // 如果已有草稿ID，更新草稿并发布
    if (draftId) {
      const { error } = await supabase
        .from('posts')
        .update({
          title,
          content,
          excerpt: excerpt || null,
          is_public: isPublic,
          published: !isDraft,
          updated_at: new Date().toISOString()
        })
        .eq('id', draftId)
        .select()
        .single();

      if (error) {
        setLoading(false);
        setMsg('发布失败: ' + error.message);
        return;
      }
    } else {
      // 创建新文章
      const { error, data } = await supabase
        .from('posts')
        .insert({
          title,
          content,
          excerpt: excerpt || null,
          author_id: sessionUserId,
          is_public: isPublic,
          published: !isDraft
        })
        .select()
        .single();

      if (error) {
        setLoading(false);
        setMsg('发布失败: ' + error.message);
        return;
      }

      inserted = data as Post | null;
      postId = inserted?.id || null;
    }

    // 插入分类关联
    if (postId && categoryIds.length) {
      await supabase.from('post_categories').delete().eq('post_id', postId);
      const catRows = categoryIds.map(cid => ({ post_id: postId, category_id: cid }));
      await supabase.from('post_categories').insert(catRows);
    }

    // 插入标签关联
    if (postId && tagIds.length) {
      await supabase.from('post_tags').delete().eq('post_id', postId);
      const tagRows = tagIds.map(tid => ({ post_id: postId, tag_id: tid }));
      await supabase.from('post_tags').insert(tagRows);
    }

    setLoading(false);
    setMsg('发布成功');

    // 获取文章slug并跳转
    const { data: postData } = await supabase
      .from('posts')
      .select('slug')
      .eq('id', postId)
      .single();

    if (postData?.slug) {
      window.location.href = `/posts/${postData.slug}`;
    }
  }

  function slugifyName(name: string) {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60) || 'cat-' + Math.random().toString(36).slice(2, 8);
  }

  async function handleCreateCategory() {
    if (!newCatName.trim()) return;
    setCreatingCat(true);
    setCatError(null);
    const slug = slugifyName(newCatName);
    const { data, error } = await supabase
      .from('categories')
      .insert({ name: newCatName.trim(), slug, description: newCatDesc || null })
      .select()
      .single();
    setCreatingCat(false);
    if (error) {
      if (error.message.includes('duplicate') || error.message.includes('unique')) {
        setCatError('分类已存在（名称或 slug 冲突）');
      } else {
        setCatError('创建分类失败: ' + error.message);
      }
      return;
    }
    const created = data as Category | null;
    if (created) {
      setCategories(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setCategoryIds(ids => [...ids, created.id]);
      setNewCatName('');
      setNewCatDesc('');
      setShowNewCat(false);
    }
  }

  return (
    <main className="space-y-6 surface p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">写新文章</h2>
        {/* 自动保存状态 */}
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          {isSaving ? (
            <>
              <Save className="w-4 h-4 animate-spin" />
              <span>保存中...</span>
            </>
          ) : lastSaved ? (
            <>
              <Clock className="w-4 h-4" />
              <span>上次保存: {lastSaved.toLocaleTimeString()}</span>
            </>
          ) : null}
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">标题</label>
          <input value={title} className='text-black' onChange={e => setTitle(e.target.value)} required />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">摘要（可选）</label>
          <textarea
          placeholder="文章摘要，会显示在文章列表和搜索结果中"
          rows={2}
          className='text-black' 
          value={excerpt} 
          onChange={e => setExcerpt(e.target.value)} 
          />
        </div>
        <div className="space-y-2">
          <label className="mb-1 block text-sm font-medium text-gray-700">内容 (Markdown)</label>
          <MarkdownEditor value={content} onChange={setContent} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">分类（可多选）</label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-6 md:grid-cols-8">
            {categories.map(c => {
              const active = categoryIds.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() =>
                    setCategoryIds(ids =>
                      ids.includes(c.id) ?
                        ids.filter(x => x !== c.id) : [...ids, c.id]
                    )}
                  className={`rounded border px-2 py-1 text-xs font-medium transition ${active ? 'border-brand-600 bg-brand-50 text-white-500' : 'border-gray-300 hover:border-brand-500 text-white-500'}`}
                >{c.name}</button>
              );
            })}
            {!categories.length && <span className="text-xs text-gray-400 col-span-full">暂无分类</span>}
          </div>
          {categoryIds.length > 0 && (
            <p className="mt-1 text-xs text-gray-500">已选择：{categoryIds.length} 个</p>
          )}
          <div className="mt-3 space-y-2">
            {!showNewCat && (
              <button
                type="button"
                onClick={() => setShowNewCat(true)}
                className="text-xs text-white-500 hover:underline"
              >+ 新建分类</button>
            )}
            {showNewCat && (
              <div className="rounded border border-gray-200 p-3 space-y-2 bg-white">
                <div>
                  <input
                    placeholder="分类名称"
                    value={newCatName}
                    onChange={e => setNewCatName(e.target.value)}
                    className="w-full rounded border border-gray-300 px-2 py-1 text-xs"
                  />
                </div>
                <div>
                  <textarea
                    placeholder="描述（可选）"
                    rows={2}
                    value={newCatDesc}
                    onChange={e => setNewCatDesc(e.target.value)}
                    className="w-full rounded border border-gray-300 px-2 py-1 text-xs"
                  />
                </div>
                {catError && <p className="text-xs text-red-600">{catError}</p>}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCreateCategory}
                    disabled={creatingCat || !newCatName.trim()}
                    className="inline-flex items-center rounded bg-brand-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-brand-700 disabled:opacity-50"
                  >{creatingCat ? '创建中...' : '保存分类'}</button>
                  <button
                    type="button"
                    onClick={() => { setShowNewCat(false); setNewCatName(''); setNewCatDesc(''); setCatError(null); }}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >取消</button>
                </div>
                <p className="text-[10px] text-gray-400">slug 将自动根据名称生成，可在后台后续调整。</p>
              </div>
            )}
          </div>
        </div>

        {/* 标签选择器 */}
        <TagSelector selectedTags={tagIds} onChange={setTagIds} />

        <div className="flex flex-col gap-2 text-sm text-gray-700 dark:text-gray-300">
          <label className="flex items-center gap-2">
            <input type='checkbox' checked={!isDraft} onChange={e => setIsDraft(!e.target.checked)} className="h-4 w-4 rounded border-gray-300" />现在发布
          </label>
          <label className="flex items-center gap-2">
            <input type='checkbox' checked={isPublic} disabled={isDraft} onChange={e => setIsPublic(e.target.checked)} className="h-4 w-4 rounded border-gray-300 disabled:opacity-40" />公开显示（需点击现在发布）
          </label>
          {/* <p className="text-xs text-gray-500">草稿：未发布且不可公开；发布后可选择是否公开。</p> */}
        </div>
        <button type='submit' disabled={loading}>{loading ? '发布中...' : '发布'}</button>
      </form>
      {msg && <p className={`text-sm ${msg.includes('失败') ? 'text-red-600' : 'text-green-600'}`}>{msg}</p>}
      {!sessionUserId && <p className="text-xs text-orange-600">未登录状态下无法发布文章。</p>}
      <p><a href='/' className="text-sm text-brand-500 hover:underline">返回首页</a></p>
    </main>
  );
}