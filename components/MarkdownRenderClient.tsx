"use client";
import { useEffect, useState } from 'react';

export default function MarkdownRenderClient({ markdown }: { markdown: string }) {
  const [html, setHtml] = useState<string>('');
  useEffect(() => {
    let active = true;
    (async () => {
      const [{ marked }, DOMPurify, hljs] = await Promise.all([
        import('marked'),
        import('dompurify'),
        import('highlight.js')
      ]);
      marked.use({
        renderer: {
          code({ text, lang }: { text: string; lang?: string | null }) {
            const language = (lang || '').trim();
            if (language && hljs.default.getLanguage(language)) {
              const highlighted = hljs.default.highlight(text, { language }).value;
              return `<pre><code class="hljs language-${language}">${highlighted}</code></pre>`;
            }
            const escaped = text.replace(/</g,'&lt;').replace(/>/g,'&gt;');
            return `<pre><code class="hljs">${escaped}</code></pre>`;
          }
        }
      });
      const raw = marked.parse(markdown || '') as string;
      const safe = DOMPurify.default.sanitize(raw);
      if (active) setHtml(safe);
    })();
    return () => { active = false; };
  }, [markdown]);

  return <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: html }} />;
}
