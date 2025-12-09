"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabaseClient } from "../../../../../lib/supabaseClient"

interface Category {
  id: string
  name: string
  slug: string
  description?: string | null
}

interface PostRow {
  id: string
  slug: string
  title: string
  excerpt: string | null
  content: string | null
  published: boolean
  is_public: boolean
}

export default function AdminPostEditPage() {
  const params = useParams()
  const router = useRouter()
  const postId = params?.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [excerpt, setExcerpt] = useState("")
  const [markdown, setMarkdown] = useState("")
  const [published, setPublished] = useState(false)
  const [isPublic, setIsPublic] = useState(false)

  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCats, setSelectedCats] = useState<string[]>([])

  const [newCatName, setNewCatName] = useState("")
  const [newCatDesc, setNewCatDesc] = useState("")
  const [catSaving, setCatSaving] = useState(false)
  const [catError, setCatError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!postId) return
    setLoading(true)
    setError(null)

    const { data: post, error: postErr } = await supabaseClient
      .from("posts")
      .select("id,slug,title,excerpt,content,published,is_public")
      .eq("id", postId)
      .maybeSingle<PostRow>()

    if (postErr || !post) {
      setError(postErr?.message || "文章不存在")
      setLoading(false)
      return
    }
    setTitle(post.title || "")
    setSlug(post.slug || "")
    setExcerpt(post.excerpt || "")
    setMarkdown(post.content || "")
    setPublished(!!post.published)
    setIsPublic(!!post.is_public)

    const { data: catRows } = await supabaseClient
      .from("categories")
      .select("id,name,slug,description")
      .order("name")
    setCategories(catRows || [])

    const { data: joinRows } = await supabaseClient
      .from("post_categories")
      .select("category_id")
      .eq("post_id", postId)
    const joinSafe: { category_id: string }[] = (joinRows as any) || []
    setSelectedCats(joinSafe.map(r => r.category_id))

    setLoading(false)
  }, [postId])

  useEffect(() => { load() }, [load])

  function toggleCat(id: string) {
    setSelectedCats(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  async function save() {
    if (!title.trim()) { setError("标题不能为空"); return }
    setSaving(true)
    setError(null)

    const { error: upErr } = await supabaseClient
      .from("posts")
      .update({
        title,
        excerpt,
        content: markdown,
        published,
        is_public: published ? isPublic : false,
        updated_at: new Date().toISOString()
      })
      .eq("id", postId)
    if (upErr) { setError("文章保存失败: " + upErr.message); setSaving(false); return }

    const { data: existing } = await supabaseClient
      .from("post_categories")
      .select("category_id")
      .eq("post_id", postId)
    const existingSafe: { category_id: string }[] = (existing as any) || []
    const existingIds = new Set<string>(existingSafe.map(e => e.category_id))
    const newIds = new Set<string>(selectedCats)
    const toInsert = [...newIds].filter(id => !existingIds.has(id))
    const toDelete = [...existingIds].filter(id => !newIds.has(id))

    if (toInsert.length) {
      const rows = toInsert.map(cid => ({ post_id: postId, category_id: cid }))
      const { error: insErr } = await supabaseClient.from("post_categories").insert(rows)
      if (insErr) { setError("分类关联新增失败: " + insErr.message); setSaving(false); return }
    }
    for (const delId of toDelete) {
      await supabaseClient
        .from("post_categories")
        .delete()
        .eq("post_id", postId)
        .eq("category_id", delId)
    }

    setSaving(false)
    router.push(`/posts/${slug}`)
  }

  async function createCategory() {
    if (!newCatName.trim()) { setCatError("名称不能为空"); return }
    setCatError(null)
    setCatSaving(true)
    const name = newCatName.trim()
    const slug = slugify(name)
    const { data, error } = await supabaseClient
      .from("categories")
      .insert({ name, slug, description: newCatDesc || null })
      .select("id,name,slug,description")
      .maybeSingle()
    if (error) setCatError("创建失败: " + error.message)
    else if (data) {
      setCategories(cs => [...cs, data as Category])
      setSelectedCats(sel => [...sel, (data as Category).id])
      setNewCatName("")
      setNewCatDesc("")
    }
    setCatSaving(false)
  }

  async function deleteCategory(id: string) {
    if (!confirm("确定删除该分类？")) return
    if (selectedCats.includes(id)) { alert("该分类已关联当前文章，请先取消选中。"); return }
    const { error } = await supabaseClient.from("categories").delete().eq("id", id)
    if (error) setCatError("删除失败: " + error.message)
    else setCategories(cs => cs.filter(c => c.id !== id))
  }

  if (loading) return <div className="surface p-6 text-sm text-neutral-500">加载中...</div>
  if (error) return <div className="surface p-6 text-sm text-red-600">{error}</div>

  return (
    <div className="max-w-3xl mx-auto surface p-6 space-y-8">
      <h1 className="text-xl font-semibold">编辑文章</h1>
      <div className="space-y-5">
        <div>
          <label className="block mb-1 text-sm font-medium">标题</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="文章标题" />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium">摘要</label>
          <textarea rows={3} value={excerpt} onChange={e => setExcerpt(e.target.value)} placeholder="简要介绍" />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium">正文（Markdown）</label>
          <textarea rows={16} value={markdown} onChange={e => setMarkdown(e.target.value)} placeholder="支持 Markdown 语法..." className="font-mono" />
        </div>
        <div className="flex items-center gap-8">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={published} onChange={e => { const v = e.target.checked; setPublished(v); if (!v) setIsPublic(false) }} />
            已发布
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" disabled={!published} checked={isPublic} onChange={e => setIsPublic(e.target.checked)} />
            公开
          </label>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">分类（多选）</p>
          <div className="flex flex-wrap gap-2">
            {categories.map(c => {
              const active = selectedCats.includes(c.id)
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleCat(c.id)}
                  className={`px-3 py-1 rounded text-xs border transition ${active ? 'bg-brand-600 text-white border-brand-600' : 'bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 border-neutral-300 dark:border-neutral-600'}`}
                >{c.name}</button>
              )
            })}
            {!categories.length && <span className="text-xs text-neutral-400">暂无分类</span>}
          </div>
          <div className="mt-4 space-y-2">
            <p className="text-xs text-neutral-500">新增分类</p>
            <input placeholder="分类名称" value={newCatName} onChange={e => setNewCatName(e.target.value)} />
            <textarea rows={2} placeholder="分类描述（可选）" value={newCatDesc} onChange={e => setNewCatDesc(e.target.value)} />
            {catError && <p className="text-xs text-red-500">{catError}</p>}
            <button type="button" disabled={catSaving} onClick={createCategory} className="btn btn-primary text-xs">{catSaving ? '创建中...' : '保存分类'}</button>
          </div>
          {!!categories.length && (
            <div className="flex flex-wrap gap-1">
              {categories.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => deleteCategory(c.id)}
                  className="text-[10px] px-1 py-0.5 rounded border border-red-300 text-white-100 hover:bg-red-50"
                >删:{c.name}</button>
              ))}
            </div>
          )}
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-3 pt-2">
          <button onClick={save} disabled={saving} className="btn btn-primary">{saving ? '保存中...' : '保存更改'}</button>
          <button type="button" onClick={() => router.push('/admin')} className="btn btn-secondary">返回后台</button>
        </div>
      </div>
    </div>
  )
}

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^\u4e00-\u9fa5a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}
