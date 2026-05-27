import { parseChartSpec } from './chartSpec.js'

const CHART_BLOCK_RE = /```chart\s*\n([\s\S]*?)```/gi
const EMBED_RE = /\[embed\s+[^\]]*\/?\s*\]/gi

function preprocessContent(content) {
  return (content || '').replace(
    EMBED_RE,
    '> 📊 图表占位（`[embed]` 已忽略）— 请让凯用 ` ```chart ` + JSON 输出。\n\n',
  )
}

/** @returns {Array<{type:'md',text:string}|{type:'chart',spec:object}>} */
export function splitMessageParts(content) {
  const text = preprocessContent(content)
  const trimmed = text.trim()
  if (trimmed.startsWith('{')) {
    const solo = parseChartSpec(trimmed)
    if (solo) return [{ type: 'chart', spec: solo }]
  }

  const parts = []
  let last = 0
  let match

  const re = new RegExp(CHART_BLOCK_RE.source, 'gi')
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      parts.push({ type: 'md', text: text.slice(last, match.index) })
    }
    const spec = parseChartSpec(match[1])
    if (spec) parts.push({ type: 'chart', spec })
    else parts.push({ type: 'md', text: match[0] })
    last = match.index + match[0].length
  }

  if (last < text.length) parts.push({ type: 'md', text: text.slice(last) })
  if (parts.length === 0) parts.push({ type: 'md', text })
  return parts
}
