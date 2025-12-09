"use client";
import { useState, useEffect, useRef } from 'react';
import { Search, X, FileText, Tag as TagIcon } from 'lucide-react';
import { supabaseClient as supabase } from '../lib/supabase';
import Link from 'next/link';
import { SearchSkeleton } from './SkeletonLoading';

interface SearchResult {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  type: 'post' | 'tag';
  color?: string;
}

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // 监听快捷键 Ctrl+K 或 Cmd+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 打开时聚焦输入框
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // 点击外部关闭
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // 搜索逻辑
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setLoading(true);

      // 搜索文章
      const { data: posts } = await supabase
        .from('posts')
        .select('id, title, slug, excerpt')
        .or(`title.ilike.%${query}%,content.ilike.%${query}%,excerpt.ilike.%${query}%`)
        .eq('is_public', true)
        .eq('published', true)
        .limit(5);

      // 搜索标签
      const { data: tags } = await supabase
        .from('tags')
        .select('id, name, slug, description, color')
        .ilike('name', `%${query}%`)
        .limit(5);

      const postResults: SearchResult[] = (posts || []).map(p => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        excerpt: p.excerpt,
        type: 'post' as const
      }));

      const tagResults: SearchResult[] = (tags || []).map(t => ({
        id: t.id,
        title: t.name,
        slug: t.slug,
        excerpt: t.description,
        type: 'tag' as const,
        color: t.color
      }));

      setResults([...postResults, ...tagResults]);
      setLoading(false);
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  function handleResultClick() {
    setIsOpen(false);
    setQuery('');
    setResults([]);
  }

  return (
    <>
      {/* 搜索按钮 */}
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-white/80 dark:hover:bg-gray-800/80 hover:border-brand-500 dark:hover:border-brand-400 transition-all shadow-sm"
      >
        <Search className="w-4 h-4 text-gray-400" />
        <span className="flex-1 text-left text-gray-500 dark:text-gray-400">搜索文章、标签...</span>
        <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-mono bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">
          <span>Ctrl</span>
          <span>+</span>
          <span>K</span>
        </kbd>
      </button>

      {/* 搜索模态框 */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/50 backdrop-blur-sm">
          <div
            ref={modalRef}
            className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            {/* 搜索输入 */}
            <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索文章、标签..."
                className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ESC
              </button>
            </div>

            {/* 搜索结果 */}
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {loading ? (
                <div className="p-4">
                  <SearchSkeleton />
                </div>
              ) : results.length > 0 ? (
                <div className="space-y-1">
                  {results.map((result) => (
                    <Link
                      key={`${result.type}-${result.id}`}
                      href={result.type === 'post' ? `/posts/${result.slug}` : `/tags/${result.slug}`}
                      onClick={handleResultClick}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                    >
                      <div className="flex-shrink-0 mt-1">
                        {result.type === 'post' ? (
                          <FileText className="w-5 h-5 text-brand-500" />
                        ) : (
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: result.color || '#3b82f6' }}
                          >
                            <TagIcon className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-brand-500 dark:group-hover:text-brand-400 truncate">
                          {result.title}
                        </h4>
                        {result.excerpt && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                            {result.excerpt}
                          </p>
                        )}
                        <span className="text-xs text-gray-400 mt-1 inline-block">
                          {result.type === 'post' ? '文章' : '标签'}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : query ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>未找到相关结果</p>
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <p className="mb-2">输入关键词开始搜索</p>
                  <p className="text-xs">支持搜索文章标题、内容和标签</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
