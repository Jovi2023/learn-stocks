/** 因子工程任务标记；useChat 据此追加专用 API 前缀 */
export const FACTOR_TASK_MARKER = '【因子工程任务】'

/** 仅拼进 API 请求，不进聊天记录 */
export const FACTOR_API_PREFIX = [
  '[因子工程协议 — 强制顺序]',
  '1) 回复必须先有一个完整的 ```python 代码块（可含 pandas/numpy 注释；用户会在浏览器 Pyodide 运行）。',
  '2) Python 之后禁止再插入第二个 python 块；然后按顺序输出恰好 3 个 ```chart 块，缺一不可、不可调换顺序。',
  '3) 三个 chart 的 title 必须分别为：「Rank IC 与累计 IC」「分层回测累计收益」「因子统计摘要」。',
  '4) chart JSON 字段与下方 schema 一致；labels 与每条 datasets[].data 等长；禁止 [embed]。',
].join('\n')

const FACTOR_LABELS = {
  momentum: '动量因子',
  reversal: '反转因子',
  volatility: '波动率因子',
  volume: '成交量因子',
  quality: '质量因子(ROE/毛利率)',
  size: '规模因子(市值)',
  combo: '复合因子',
}

/** 固定 3 张图的 JSON 骨架（Kai 须填真实 labels/data，结构不可改） */
export function factorChartSchemas(quantiles) {
  const q = Math.min(10, Math.max(3, Number(quantiles) || 5))

  return [
    {
      order: 1,
      title: 'Rank IC 与累计 IC',
      template: {
        type: 'line',
        title: 'Rank IC 与累计 IC',
        labels: ['期次1', '期次2'],
        datasets: [
          { label: 'Rank IC', data: [0, 0] },
          { label: '累计 IC', data: [0, 0] },
        ],
      },
    },
    {
      order: 2,
      title: '分层回测累计收益',
      template: {
        type: 'line',
        title: '分层回测累计收益',
        labels: ['期次1', '期次2'],
        datasets: Array.from({ length: q }, (_, i) => ({
          label: `Q${i + 1}`,
          data: [0, 0],
        })),
      },
    },
    {
      order: 3,
      title: '因子统计摘要',
      template: {
        type: 'bar',
        title: '因子统计摘要',
        labels: ['IC均值', 'ICIR', 'IC胜率', '多空收益'],
        datasets: [{ label: '数值', data: [0, 0, 0, 0] }],
      },
    },
  ]
}

export function isFactorTask(text) {
  return String(text || '').includes(FACTOR_TASK_MARKER)
}

/**
 * @param {object} form — FactorPanel 表单快照
 */
export function buildFactorPrompt(form) {
  const f = form
  const symbols = f.symbols?.trim()
    ? f.symbols
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
        .join(',')
    : '自动选取市场核心股票'

  const factorDesc =
    f.factorType === 'combo'
      ? `复合因子，子因子权重：动量=${f.weights.momentum} 反转=${f.weights.reversal} 波动率=${f.weights.volatility} 成交量=${f.weights.volume} 质量=${f.weights.quality} 规模=${f.weights.size}`
      : FACTOR_LABELS[f.factorType] || f.factorType

  const schemas = factorChartSchemas(f.quantiles)
  const schemaBlocks = schemas.map(
    (s) =>
      `chart ${s.order}（title 必须为「${s.title}」）：\n\`\`\`chart\n${JSON.stringify(s.template, null, 2)}\n\`\`\``,
  )

  return [
    `${FACTOR_TASK_MARKER} 严格按「Python → 3×chart」顺序回复。`,
    '',
    '## 任务参数',
    `- 市场：${f.market === 'us' ? '美股' : 'A股'}`,
    `- 股票池：${symbols}`,
    `- 因子类型：${factorDesc}`,
    `- 回溯窗口：${f.lookback}天`,
    `- 持有期：${f.holdPeriod}天`,
    `- 分层组数：${f.quantiles}组（chart2 须有 Q1…Q${f.quantiles} 共 ${f.quantiles} 条线）`,
    `- 回测区间：${f.dateFrom} ~ ${f.dateTo}`,
    '',
    '## 计算步骤（写在 Python 里完成）',
    `1. 为每只股票计算因子值（回溯 ${f.lookback} 天）`,
    `2. 每期 Rank IC：因子值 vs 未来 ${f.holdPeriod} 天收益的截面 rank correlation`,
    `3. 按因子值分 ${f.quantiles} 组分层回测，各组累计收益`,
    '4. 统计：IC均值、ICIR、IC胜率、多空(Top-Bottom)累计收益',
    '',
    '## 回复格式（违反则视为未完成）',
    '',
    '### 第一步 — 仅一个 Python 代码块',
    '```python',
    '# 完整可运行脚本：读参、算因子、IC、分层、统计；打印关键中间结果',
    '# 若无法拉真实行情，用合理模拟数据并在注释注明',
    '```',
    '',
    '### 第二步 — 恰好 3 个 chart 块（顺序与 title 固定，用 Python 算出的数填入）',
    ...schemaBlocks,
    '',
    '约束：chart1 type=line，2 条线 Rank IC + 累计 IC；chart2 type=line，datasets 数量=' +
      `${f.quantiles}，label 为 Q1…Q${f.quantiles}；chart3 type=bar，labels 固定 4 项且 datasets 仅 1 条「数值」。`,
    '数据须与 Python 输出一致；禁止在 Python 之前或三个 chart 之间插入额外 chart/python。',
  ].join('\n')
}
