"use client";
import { useState, useEffect } from 'react';
import { supabaseClient as supabase } from '../lib/supabase';
import { Tag } from '../types/tag';
import { X } from 'lucide-react';

interface TagSelectorProps {
  selectedTags: string[]; // tag IDs
  onChange: (tagIds: string[]) => void;
}

export default function TagSelector({ selectedTags, onChange }: TagSelectorProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTagName, setNewTagName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadTags();
  }, []);

  async function loadTags() {
    setLoading(true);
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('name');

    if (!error && data) {
      setTags(data as Tag[]);
    }
    setLoading(false);
  }

  async function createTag() {
    if (!newTagName.trim()) return;

    setCreating(true);
    const slug = newTagName.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const { data, error } = await supabase
      .from('tags')
      .insert({
        name: newTagName.trim(),
        slug: slug,
        color: getRandomColor()
      })
      .select()
      .single();

    setCreating(false);

    if (!error && data) {
      setTags([...tags, data as Tag]);
      onChange([...selectedTags, data.id]);
      setNewTagName('');
    } else {
      alert('创建标签失败: ' + (error?.message || '未知错误'));
    }
  }

  function toggleTag(tagId: string) {
    if (selectedTags.includes(tagId)) {
      onChange(selectedTags.filter(id => id !== tagId));
    } else {
      onChange([...selectedTags, tagId]);
    }
  }

  function getRandomColor() {
    const colors = [
      '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b',
      '#10b981', '#06b6d4', '#6366f1', '#f43f5e'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  const selectedTagObjects = tags.filter(t => selectedTags.includes(t.id));

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        标签
      </label>

      {/* 已选标签显示 */}
      {selectedTagObjects.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTagObjects.map(tag => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium text-white"
              style={{ backgroundColor: tag.color || '#3b82f6' }}
            >
              {tag.name}
              <button
                type="button"
                onClick={() => toggleTag(tag.id)}
                className="hover:bg-white/20 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* 标签选择 */}
      <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-800">
        {loading ? (
          <p className="text-sm text-gray-500">加载标签中...</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => {
              const isSelected = selectedTags.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                    isSelected
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                      : 'bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                  style={isSelected ? { borderColor: tag.color, borderWidth: '2px' } : {}}
                >
                  {tag.name}
                </button>
              );
            })}
            {tags.length === 0 && (
              <p className="text-sm text-gray-500">暂无标签，请创建新标签</p>
            )}
          </div>
        )}

        {/* 创建新标签 */}
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createTag()}
              placeholder="创建新标签..."
              className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:text-white"
              disabled={creating}
            />
            <button
              type="button"
              onClick={createTag}
              disabled={creating || !newTagName.trim()}
              className="px-4 py-1.5 text-sm bg-brand-500 text-white rounded hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? '创建中...' : '创建'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
