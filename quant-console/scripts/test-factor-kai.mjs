#!/usr/bin/env node
/**
 * 端到端：因子工程 prompt → 本地 cors-proxy → Kai
 * 用法：node scripts/test-factor-kai.mjs
 */
import { CHART_API_PREFIX } from '../src/utils/chartSpec.js'
import { FACTOR_API_PREFIX, buildFactorPrompt } from '../src/utils/factorPrompt.js'

const form = {
  market: 'us',
  symbols: 'AAPL\nMSFT',
  factorType: 'momentum',
  lookback: 20,
  holdPeriod: 5,
  quantiles: 3,
  dateFrom: '2024-01-01',
  dateTo: '2024-06-30',
  weights: { momentum: 0.3, reversal: 0.2, volatility: 0.15, volume: 0.15, quality: 0.1, size: 0.1 },
}

const userPrompt = buildFactorPrompt(form)
const input = `${CHART_API_PREFIX}\n${FACTOR_API_PREFIX}\n\n${userPrompt}`

const TIMEOUT_MS = Number(process.env.KAI_TEST_TIMEOUT_MS) || 300_000

process.stdout.write('→ POST http://127.0.0.1:18888/v1/responses (因子工程 smoke test)…\n')

const res = await fetch('http://127.0.0.1:18888/v1/responses', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-openclaw-agent-id': 'main',
  },
  body: JSON.stringify({ model: 'openclaw', input }),
  signal: AbortSignal.timeout(TIMEOUT_MS),
})

if (!res.ok) {
  const err = await res.text()
  process.stderr.write(`HTTP ${res.status}\n${err.slice(0, 2000)}\n`)
  process.exit(1)
}

const data = await res.json()
const items = data?.output || []
let text = ''
for (const item of items) {
  for (const c of item?.content || []) {
    if (c?.type === 'output_text') text += c.text || ''
  }
}

const checks = {
  hasPython: /```python[\s\S]*?```/i.test(text),
  chartCount: (text.match(/```chart/gi) || []).length,
  title1: text.includes('Rank IC 与累计 IC'),
  title2: text.includes('分层回测累计收益'),
  title3: text.includes('因子统计摘要'),
  pythonBeforeChart:
    !/```chart/i.test(text) ||
    text.search(/```python/i) < text.search(/```chart/i),
}

process.stdout.write('\n--- 协议检查 ---\n')
for (const [k, v] of Object.entries(checks)) {
  process.stdout.write(`${v ? '✓' : '✗'} ${k}\n`)
}

const outPath = new URL('../test-factor-kai-last.txt', import.meta.url)
await import('node:fs').then(({ writeFileSync }) =>
  writeFileSync(outPath, text, 'utf8'),
)
process.stdout.write(`\n完整回复已写入 test-factor-kai-last.txt（${text.length} 字符）\n`)
process.stdout.write('\n--- 回复预览（前 2500 字）---\n')
process.stdout.write(text.slice(0, 2500))
if (text.length > 2500) process.stdout.write('\n…\n')

const ok =
  checks.hasPython &&
  checks.chartCount === 3 &&
  checks.title1 &&
  checks.title2 &&
  checks.title3 &&
  checks.pythonBeforeChart

process.exit(ok ? 0 : 2)
