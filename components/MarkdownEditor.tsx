"use client";
import { useEffect, useState, useRef } from 'react';
import { renderMarkdown } from '../lib/markdown';
import { supabaseClient as supabase } from '../lib/supabase';
import ImageUpload from './ImageUpload';
import { Image as ImageIcon, X } from 'lucide-react';

interface Props { value: string; onChange: (v: string) => void; }

const codeLanguages = [
  'javascript', 'typescript', 'json', 'bash', 'shell', 'sql', 'html', 'css', 'go', 'java', 'python', 'rust', 'csharp', 'graphql', 'solidity', 'sol', 'markdown'
];

export default function MarkdownEditor({ value, onChange }: Props) {
  const [preview, setPreview] = useState('');
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { setPreview(renderMarkdown(value)); }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    onChange(e.target.value);
  }

  // 插入图片 Markdown 语法
  function insertImage(url: string, alt: string = '图片') {
    const imageMarkdown = `![${alt}](${url})`;
    const textarea = textareaRef.current;

    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = value.substring(0, start) + '\n' + imageMarkdown + '\n' + value.substring(end);
      onChange(newValue);

      // 设置光标位置到插入的图片后面
      setTimeout(() => {
        textarea.focus();
        const newPosition = start + imageMarkdown.length + 2;
        textarea.setSelectionRange(newPosition, newPosition);
      }, 0);
    } else {
      onChange(value + '\n' + imageMarkdown + '\n');
    }

    setShowImageUpload(false);
  }

  // 处理图片上传成功
  function handleImageUploaded(url: string, fileName: string) {
    const alt = fileName.replace(/\.[^/.]+$/, ''); // 移除扩展名
    insertImage(url, alt);
  }

  // 处理粘贴事件（支持粘贴图片）
  async function handlePaste(e: React.ClipboardEvent) {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      // 检查是否是图片
      if (item.type.indexOf('image') === 0) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) continue;

        setUploading(true);

        try {
          // 生成文件路径
          const now = new Date();
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const timestamp = Date.now();
          const extension = file.type.split('/')[1] || 'png';
          const fileName = `paste-${timestamp}.${extension}`;
          const filePath = `${year}/${month}/${fileName}`;

          // 上传到 Supabase Storage
          const { data, error } = await supabase.storage
            .from('post-images')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false
            });

          if (error) throw error;

          // 获取公开 URL
          const { data: urlData } = supabase.storage
            .from('post-images')
            .getPublicUrl(filePath);

          // 插入图片
          insertImage(urlData.publicUrl, '粘贴的图片');
        } catch (err) {
          console.error('粘贴上传失败:', err);
          alert('图片上传失败，请重试');
        } finally {
          setUploading(false);
        }

        break;
      }
    }
  }

  return (
    <div className="space-y-4">
      {/* 工具栏 */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setShowImageUpload(!showImageUpload)}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
        >
          <ImageIcon className="w-4 h-4" />
          {showImageUpload ? '关闭图片上传' : '上传图片'}
        </button>

        {uploading && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            正在上传粘贴的图片...
          </span>
        )}
      </div>

      {/* 图片上传面板 */}
      {showImageUpload && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">上传图片</h4>
            <button
              onClick={() => setShowImageUpload(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <ImageUpload onImageUploaded={handleImageUploaded} />
        </div>
      )}

      {/* 编辑器和预览 */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className='dark:text-white'>Markdown 输入</span>
            <div className="flex items-center gap-2">
              <select
                className="text-xs border rounded px-1 py-0.5"
                onChange={e => {
                  const lang = e.target.value;
                  if (!lang) return;
                  const addition = `\n\n\`\`\`${lang}\n// 在这里输入代码\n\`\`\`\n`;
                  onChange(value + addition);
                  e.target.value = '';
                }}
              >
                <option value="">插入代码块语言…</option>
                {codeLanguages.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onPaste={handlePaste}
            rows={24}
            className="w-full rounded border border-gray-300 p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-black"
            placeholder="在这里输入 Markdown 内容

💡 提示：
- 可以直接粘贴图片（Ctrl+V）
- 点击上方「上传图片」按钮
- 支持拖拽图片上传"
          />
        </div>
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className='dark:text-white'>实时预览</span>
            <span className='dark:text-white'>(Markdown 渲染)</span>
          </div>
          <div
            className="prose prose-sm max-w-none border rounded bg-white p-4 min-h-[400px] overflow-auto"
            dangerouslySetInnerHTML={{ __html: enhanceCodeBlocks(preview) }}
          />
        </div>
      </div>
    </div>
  );
}


function enhanceCodeBlocks(html: string): string {
  return html.replace(/<pre><code class="(language-[^"]*)">([\s\S]*?)<\/code><\/pre>/g, (_m, cls, code) => {
    const rawLang = cls.replace('language-', '');
    const aliasMap: Record<string,string> = { sol: 'solidity' };
    const lang = aliasMap[rawLang] || rawLang;
    const safeLang = codeLanguages.includes(lang) ? lang : 'plaintext';
    const copyBtn = '<button data-copy class="text-xs ml-2 text-brand-500 hover:underline">复制</button>';
    return `<div class="code-block-wrapper relative group mb-4"><div class="flex items-center gap-2 absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition"><span class="text-xs bg-gray-100 px-2 py-0.5 rounded border border-gray-200">${safeLang}</span>${copyBtn}</div><pre><code class="language-${safeLang}">${code}</code></pre></div>`;
  });
}
