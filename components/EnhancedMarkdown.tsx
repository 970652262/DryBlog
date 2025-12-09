"use client";
import { useEffect, useState, useMemo } from 'react';

interface Heading { id: string; text: string; level: number; }

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'section';
}

export default function EnhancedMarkdown({ markdown }: { markdown: string }) {
  const [html, setHtml] = useState('');
  const [headings, setHeadings] = useState<Heading[]>([]);

  // approximate reading time (Chinese + English)
  const readingTime = useMemo(() => {
    // 统计中文字符（汉字）数量，正则 /[\u4e00-\u9fa5]/g 捕获汉字并计数。
    const cjkChars = (markdown.match(/[\u4e00-\u9fa5]/g) || []).length;
  
    const words = markdown
      // 将所有汉字替换成空格，剩下的英文、数字按词拆分（以空白分割），得到英文单词数。
      .replace(/[\u4e00-\u9fa5]/g, ' ') 
      .split(/\s+/)
      // 把每个汉字当作一个“词”来算，总词数 = 英文词数 + 汉字数。
      .filter(Boolean).length + cjkChars; 
    // 假设每分钟阅读 300 词，向上取整。Math.max(1, ...) 确保最少 1 分钟。
    return Math.max(1, Math.ceil(words / 300));
  }, [markdown]);

  // 复制代码功能
  useEffect(() => {
    const handleCopy = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('copy-button')) {
        const pre = target.closest('pre');
        if (pre) {
          const code = pre.querySelector('code');
          if (code) {
            // 提取纯文本（去除行号）
            const lines = Array.from(code.querySelectorAll('.code-line'));
            const text = lines
              .map(line => {
                const lineNumber = line.querySelector('.line-number');
                return line.textContent?.replace(lineNumber?.textContent || '', '') || '';
              })
              .join('\n');

            navigator.clipboard.writeText(text).then(() => {
              target.textContent = '已复制!';
              setTimeout(() => {
                target.textContent = '复制';
              }, 2000);
            });
          }
        }
      }
    };

    document.addEventListener('click', handleCopy);
    return () => document.removeEventListener('click', handleCopy);
  }, []);

  // 图片懒加载和点击放大功能
  useEffect(() => {
    const images = document.querySelectorAll('.prose img');

    images.forEach((img) => {
      const htmlImg = img as HTMLImageElement;

      // 添加懒加载属性
      htmlImg.loading = 'lazy';
      htmlImg.style.cursor = 'pointer';
      htmlImg.classList.add('rounded-lg', 'transition-transform', 'hover:scale-105');

      // 点击图片放大
      const handleImageClick = () => {
        // 创建灯箱
        const lightbox = document.createElement('div');
        lightbox.className = 'fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4';
        lightbox.style.cursor = 'zoom-out';

        // 关闭灯箱的统一函数
        const closeLightbox = () => {
          if (lightbox.parentNode) {
            document.body.removeChild(lightbox);
            document.body.style.overflow = '';
            document.removeEventListener('keydown', handleEsc);
          }
        };

        // ESC 键关闭
        const handleEsc = (e: KeyboardEvent) => {
          if (e.key === 'Escape') {
            closeLightbox();
          }
        };

        // 大图
        const bigImg = document.createElement('img');
        bigImg.src = htmlImg.src;
        bigImg.alt = htmlImg.alt;
        bigImg.className = 'max-w-full max-h-[90vh] object-contain';
        bigImg.style.cursor = 'default';
        bigImg.onclick = (e) => e.stopPropagation();

        // 关闭按钮
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '✕';
        closeBtn.className = 'absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white text-xl font-bold';
        closeBtn.onclick = (e) => {
          e.stopPropagation();
          closeLightbox();
        };

        // 图片信息
        const info = document.createElement('div');
        info.className = 'absolute bottom-4 left-4 right-4 text-center';
        info.innerHTML = `
          <p class="text-sm text-white/80">${htmlImg.alt || '图片'}</p>
          <p class="text-xs text-white/60 mt-1">点击任意位置或按 ESC 关闭</p>
        `;

        lightbox.appendChild(bigImg);
        lightbox.appendChild(closeBtn);
        lightbox.appendChild(info);

        // 点击背景关闭
        lightbox.onclick = closeLightbox;

        document.addEventListener('keydown', handleEsc);

        // 防止背景滚动
        document.body.style.overflow = 'hidden';

        document.body.appendChild(lightbox);
      };

      htmlImg.addEventListener('click', handleImageClick);
    });
  }, [html]);

  useEffect(() => {
    let active = true;
    (async () => {
      const [{ marked }, DOMPurify, hljs] = await Promise.all([
        import('marked'),
        import('dompurify'),
        import('highlight.js')
      ]);
      // 兼容不同打包方式的 default 导出（有的库可能没有 .default）
      const dompurify: any = (DOMPurify as any)?.default || DOMPurify;
      const hl: any = (hljs as any)?.default || hljs;
      // 如果未注册 solidity，则尝试注册（某些构建不包含）
      if (!hl.getLanguage('solidity')) {
        try {
          // 动态加载插件并执行或按属性注册
          // @ts-ignore: no types
          const solMod: any = await import('highlightjs-solidity');
          if (typeof solMod.default === 'function') {
            solMod.default(hl);
          } else if (typeof solMod === 'function') {
            solMod(hl);
          } else if (solMod.solidity) {
            hl.registerLanguage('solidity', solMod.solidity);
          }
        } catch {}
      }

      marked.use({
        renderer: {
          heading({ text, depth }: { text: string; depth: number }) {
            const baseId = slugify(text);
            // ensure unique id
            let id = baseId;
            let i = 1;
            while (headings.find(h => h.id === id)) {
              id = baseId + '-' + i++;
            }
            if (active) {
              setHeadings(prev => [...prev, { id, text, level: depth }]);
            }
            return `<h${depth} id="${id}" class="group scroll-mt-24">${text}<a href="#${id}" class="opacity-0 group-hover:opacity-60 ml-2 text-xs align-middle text-brand-500">#</a></h${depth}>`;
          },
          code({ text, lang }: { text: string; lang?: string | null }) {
            const rawLang = (lang || '').trim();
            const aliasMap: Record<string,string> = { sol: 'solidity' };
            const language = aliasMap[rawLang] || rawLang;
            const copyButton = '<button class="copy-button">复制</button>';

            if (language && hl.getLanguage(language)) {
              const highlighted = hl.highlight(text, { language }).value;
              const lines = highlighted.split('\n');
              const numbered = lines
                .map((l: string, i: number) => `<span class="code-line"><span class="line-number">${i + 1}</span>${l || '\u200b'}</span>`)
                .join('\n');
              return `<pre class="code-with-lines">${copyButton}<code class="hljs language-${language}">${numbered}</code></pre>`;
            }
            const escaped = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const lines = escaped.split('\n');
            const numbered = lines
              .map((l: string, i: number) => `<span class="code-line"><span class="line-number">${i + 1}</span>${l || '\u200b'}</span>`)
              .join('\n');
            return `<pre class="code-with-lines">${copyButton}<code class="hljs">${numbered}</code></pre>`;
          }
        }
      });

      // reset headings before re-render
      setHeadings([]);
      let raw = marked.parse(markdown || '') as string;
      // 如果自定义 renderer 未生效（例如 Marked 版本差异），则 raw 不包含 code-with-lines，需要后处理增加行号
      if (!raw.includes('code-with-lines')) {
        raw = raw.replace(/<pre><code([^>]*)>([\s\S]*?)<\/code><\/pre>/g, (m, attr, inner) => {
          const copyButton = '<button class="copy-button">复制</button>';
          // 保留原有代码内容（已高亮的 spans），按换行拆分
          const lines = inner.split(/\n/);
          const numbered = lines
            .map((l: string, i: number) => `<span class=\"code-line\"><span class=\"line-number\">${i + 1}</span>${l || '&#8203;'}</span>`)
            .join('\n');
          return `<pre class=\"code-with-lines\">${copyButton}<code${attr}>${numbered}</code></pre>`;
        });
      }
      const safe = dompurify.sanitize(raw, {
        ADD_TAGS: ['button'],
        ADD_ATTR: ['class']
      });
      if (active) setHtml(safe);
    })();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markdown]);

  const [open, setOpen] = useState(false);
  const showToc = headings.length > 0;
  return (
    <div className="flex flex-row gap-8">
      {/* Left Sidebar */}
      {showToc && (
        <div className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-24 space-y-4 text-xs">
            <div className="rounded-md border border-neutral-200 dark:border-neutral-700 bg-white/80 dark:bg-neutral-800/70 backdrop-blur p-3 shadow-sm">
              <div className="text-center mt-3 text-blue-500 dark:text-white-400 mb-4">阅读本文需约 {readingTime} 分钟</div>
              <p className="font-medium mb-2 text-neutral-700 dark:text-neutral-200">目录</p>
              <ul className="space-y-1">
                {headings.filter(h => h.level <= 3).map(h => (
                  <li key={h.id} className={`pl-${(h.level - 1) * 2}`}>
                    <a href={`#${h.id}`} className="block truncate text-neutral-600 hover:text-brand-600 dark:text-neutral-300 dark:hover:text-brand-400 transition-colors">{h.text}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
      {/* Mobile TOC toggle */}
      {showToc && (
        <button onClick={() => setOpen(o => !o)} className="lg:hidden mb-4 px-3 py-1 rounded border border-neutral-300 dark:border-neutral-600 text-xs bg-white/60 dark:bg-neutral-800/60 backdrop-blur">
          {open ? '收起目录' : '展开目录'}
        </button>
      )}
      <div className="prose prose-sm max-w-none flex-1" dangerouslySetInnerHTML={{ __html: html }} />
      {open && showToc && (
        <div className="lg:hidden w-full mt-4 text-xs">
          <div className="rounded-md border border-neutral-200 dark:border-neutral-700 bg-white/80 dark:bg-neutral-800/70 backdrop-blur p-3 shadow-sm">
            <p className="font-medium mb-2 text-neutral-700 dark:text-neutral-200">目录</p>
            <ul className="space-y-1">
              {headings.filter(h => h.level <= 3).map(h => (
                <li key={h.id} className={`pl-${(h.level - 1) * 2}`}>
                  <a href={`#${h.id}`} className="block truncate text-neutral-600 hover:text-brand-600 dark:text-neutral-300 dark:hover:text-brand-400 transition-colors" onClick={() => setOpen(false)}>{h.text}</a>
                </li>
              ))}
            </ul>
            <div className="mt-3 text-neutral-500 dark:text-neutral-400">≈ {readingTime} 分钟</div>
          </div>
        </div>
      )}
    </div>
  );
}
