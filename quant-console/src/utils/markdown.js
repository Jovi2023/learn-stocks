// Markdown 渲染 + XSS 清洗
// 红线：v-html 渲染前必须过 DOMPurify，见 .cursor/rules/security.mdc 第 2 条

import { marked } from 'marked'
import DOMPurify from 'dompurify'

// 模型偶尔会带 raw HTML（如 <script>、event handler、javascript:URL），全部丢弃
// 同时给所有外链加 rel="noopener noreferrer"，防 reverse tabnabbing
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A') {
    node.setAttribute('target', '_blank')
    node.setAttribute('rel', 'noopener noreferrer')
  }
})

export function renderMarkdown(text) {
  const html = marked.parse(text || '', { breaks: true })
  return DOMPurify.sanitize(html)
}
