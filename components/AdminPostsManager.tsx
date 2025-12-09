"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { supabaseClient } from "../lib/supabaseClient"

type SlimPost = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  published: boolean
  is_public: boolean
  created_at: string
}

export default function AdminPostsManager() {
  const [posts, setPosts] = useState<SlimPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  async function loadPosts() {
    setLoading(true)
    const { data, error } = await supabaseClient
      .from("posts")
      .select("id,title,slug,excerpt,published,is_public,created_at")
      .order("created_at", { ascending: false })
      .limit(100)
    if (error) setError(error.message)
    else setPosts(data || [])
    setLoading(false)
  }

  useEffect(() => {
    loadPosts()
  }, [])

  async function deletePost(id: string) {
    if (!confirm("确定删除该文章？")) return
    setBusyId(id)
    const { error } = await supabaseClient.from("posts").delete().eq("id", id)
    if (error) alert("删除失败: " + error.message)
    else setPosts(ps => ps.filter(p => p.id !== id))
    setBusyId(null)
  }

  if (loading) return <p className="text-sm text-neutral-500">加载文章...</p>
  if (error) return <p className="text-sm text-red-600">{error}</p>

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">文章管理</h2>
      <ul className="space-y-3">
        {posts.map(p => {
          const status =
            (p.published ? "已发布" : "草稿") + " · " + (p.is_public ? "公开" : "私密")
          return (
            <li
              key={p.id}
              className="surface px-4 py-3 flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <Link
                  href={`/posts/${p.slug}`}
                  className="font-medium truncate hover:underline"
                >
                  {p.title || "（无标题）"}
                </Link>
                <p className="text-xs text-black-600 mt-1">{status}</p>
                {p.excerpt && (
                  <p className="text-xs text-black-600 dark:text-neutral-400 mt-1 line-clamp-2">
                    {p.excerpt}
                  </p>
                )}
                <p className="text-[11px] text-black-400 mt-1">
                  {formatDate(p.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/admin/posts/${p.id}/edit`}
                  className="btn btn-secondary text-xs"
                >
                  编辑
                </Link>
                <button
                  onClick={() => deletePost(p.id)}
                  disabled={busyId === p.id}
                  className="btn btn-warning text-xs"
                >
                  删除
                </button>
                <Link
                  href={`/posts/${p.slug}`}
                  className="btn btn-secondary text-xs"
                  target="_blank"
                >
                  查看
                </Link>
              </div>
            </li>
          )
        })}
        {!posts.length && (
          <li className="text-sm text-neutral-500 py-6 text-center">暂无文章</li>
        )}
      </ul>
    </div>
  )
}

function formatDate(v: string) {
  const d = new Date(v)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`
}
function pad(n: number) {
  return n < 10 ? "0" + n : "" + n
}