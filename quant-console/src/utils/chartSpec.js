// AI 图表协议：凯在回复里用 ```chart … ``` 输出 JSON，前端校验后交给 Chart.js

const ALLOWED_TYPES = new Set(['line', 'bar'])
const MAX_LABELS = 120
const MAX_DATASETS = 8
const MAX_TITLE = 80
const MAX_LABEL_LEN = 32

// 仅拼进 API 请求，不进聊天记录
export const CHART_API_PREFIX = [
  '[quant-console 协议]',
  '画图必须用 ```chart + JSON```，禁止 [embed]；JSON 需完整 datasets[].data，与 labels 等长。',
].join(' ')

export const CHART_PROMPT_HINT = [
  '画图时用 fenced block，语言标记 `chart`，内容为 JSON：',
  '```chart',
  '{"type":"line","title":"标题","labels":["A","B"],"datasets":[{"label":"序列","data":[1,2]}]}',
  '```',
  'type 仅 line|bar；labels 与每条 datasets[].data 等长；最多 8 条线。',
].join('\n')

export function parseChartSpec(raw) {
  let data
  try {
    data = JSON.parse(String(raw || '').trim())
  } catch (_) {
    return null
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null

  const type = data.type
  if (!ALLOWED_TYPES.has(type)) return null
  if (!Array.isArray(data.labels) || data.labels.length === 0 || data.labels.length > MAX_LABELS) {
    return null
  }
  if (!Array.isArray(data.datasets) || data.datasets.length === 0 || data.datasets.length > MAX_DATASETS) {
    return null
  }

  const labels = data.labels.map((l) => String(l).slice(0, MAX_LABEL_LEN))
  const datasets = []

  for (const ds of data.datasets) {
    if (!ds || typeof ds.label !== 'string') return null
    if (!Array.isArray(ds.data) || ds.data.length !== labels.length) return null
    const nums = ds.data.map((v) => Number(v))
    if (nums.some((n) => !Number.isFinite(n))) return null
    const color = typeof ds.color === 'string' && /^#[0-9a-fA-F]{6}$/.test(ds.color)
      ? ds.color
      : undefined
    datasets.push({
      label: ds.label.slice(0, 40),
      data: nums,
      color,
    })
  }

  const title = typeof data.title === 'string' ? data.title.slice(0, MAX_TITLE) : ''
  return { type, title, labels, datasets }
}
