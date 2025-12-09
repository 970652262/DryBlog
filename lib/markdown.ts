import { marked } from 'marked';

import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import json from 'highlight.js/lib/languages/json';
import bash from 'highlight.js/lib/languages/bash';
import shell from 'highlight.js/lib/languages/shell';
import sql from 'highlight.js/lib/languages/sql';
import xml from 'highlight.js/lib/languages/xml'; 
import css from 'highlight.js/lib/languages/css';
import go from 'highlight.js/lib/languages/go';
import java from 'highlight.js/lib/languages/java';
import python from 'highlight.js/lib/languages/python';
import rust from 'highlight.js/lib/languages/rust';
import csharp from 'highlight.js/lib/languages/csharp';
import graphql from 'highlight.js/lib/languages/graphql';
import markdownLang from 'highlight.js/lib/languages/markdown';

// @ts-ignore: highlightjs-solidity
import solidityPlugin from 'highlightjs-solidity';
import DOMPurify from 'dompurify';

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('json', json);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('shell', shell);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('css', css);
hljs.registerLanguage('go', go);
hljs.registerLanguage('java', java);
hljs.registerLanguage('python', python);
hljs.registerLanguage('rust', rust);
hljs.registerLanguage('csharp', csharp);
hljs.registerLanguage('graphql', graphql);
hljs.registerLanguage('markdown', markdownLang);
// 正确注册 solidity：插件可能是一个函数(需要执行)或对象上有 .solidity
try {
  const maybeFn: any = solidityPlugin as any;
  if (typeof maybeFn === 'function') {
    maybeFn(hljs);
  } else if (maybeFn?.solidity) {
    hljs.registerLanguage('solidity', maybeFn.solidity);
  }
} catch {}

function escapeHtml(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

marked.use({
  renderer: {
    code(this: any, { text, lang }: { text: string; lang?: string | null }) {
      const rawLang = (lang || '').trim();
      const aliasMap: Record<string,string> = { sol: 'solidity' };
      const language = aliasMap[rawLang] || rawLang;
      if (language && hljs.getLanguage(language)) {
        const highlighted = hljs.highlight(text, { language }).value;
        return `<pre><code class="hljs language-${language}">${highlighted}</code></pre>`;
      }
      return `<pre><code class="hljs">${escapeHtml(text)}</code></pre>`;
    }
  }
});

export function renderMarkdown(md: string): string {
  const raw = marked.parse(md || '', { async: false }) as string;
  return DOMPurify.sanitize(raw);
}
