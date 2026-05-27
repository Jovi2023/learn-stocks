// Markdown 渲染 + 代码高亮 + XSS 清洗
// 红线：v-html 渲染前必须过 DOMPurify，见 .cursor/rules/security.mdc 第 2 条

import { marked } from 'marked'
import { markedHighlight } from 'marked-highlight'
import DOMPurify from 'dompurify'
import hljs from 'highlight.js/lib/core'
import python from 'highlight.js/lib/languages/python'
import javascript from 'highlight.js/lib/languages/javascript'
import bash from 'highlight.js/lib/languages/bash'
import json from 'highlight.js/lib/languages/json'
import 'highlight.js/styles/atom-one-dark.css'

// 只按需注册——hljs 完整版含 190+ 语言会让 bundle 暴涨 1MB+
// 凯主要返回 Python，偶尔 js/bash/json；其他语言以后真用到再加
hljs.registerLanguage('python', python)
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('json', json)

// marked v18 已移除内置 highlight option，要走 marked-highlight 扩展
marked.use(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext'
      try {
        return hljs.highlight(code, { language, ignoreIllegals: true }).value
      } catch (_) {
        // 解析挂了也别让整条消息渲染崩，回退到纯文本
        return code
      }
    },
  }),
)

// 模型偶尔会带 raw HTML（如 <script>、event handler、javascript:URL），全部丢弃
// 同时给所有外链加 rel="noopener noreferrer"，防 reverse tabnabbing
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A') {
    node.setAttribute('target', '_blank')
    node.setAttribute('rel', 'noopener noreferrer')
  }
})

function isPythonBlock(inner, attrs) {
  const hay = `${attrs} ${inner}`
  return /language-python/i.test(hay)
}

function codeBlockToolbar(inner, attrs) {
  const run = isPythonBlock(inner, attrs)
    ? '<button type="button" class="code-run-btn" aria-label="运行 Python" title="运行 Python"><span class="code-run-label" aria-hidden="true">▶</span></button>'
    : ''
  const copy = '<button type="button" class="code-copy-btn" aria-label="复制代码" title="复制代码"><span class="code-copy-label" aria-hidden="true">📋</span></button>'
  return `<div class="code-block-toolbar">${run}${copy}</div>`
}

function wrapCodeBlocks(html) {
  return html.replace(
    /<pre(\s[^>]*)?>([\s\S]*?)<\/pre>/gi,
    (_, attrs = '', inner) =>
      `<div class="code-block-wrap">${codeBlockToolbar(inner, attrs)}<pre${attrs}>${inner}</pre><pre class="code-run-output" hidden></pre></div>`,
  )
}

export function renderMarkdown(text) {
  const html = wrapCodeBlocks(marked.parse(text || '', { breaks: true }))
  return DOMPurify.sanitize(html)
}
