/**
 * 模拟响应数据
 * 这些是控制台的模拟回复内容，展示交互效果
 * 未来接入 OpenClaw API 后，这里将被真实响应替换
 */

export const welcomeMsg = [
  '早上好 👋 我是 **凯**，你的量化助手。',
  '',
  '我可以帮你：',
  '- 📊 **跑回测** — 选择美股或A股，在右侧面板设置参数',
  '- 💻 **写代码** — 描述需求，我生成完整代码',
  '- 📈 **查数据** — 获取任意美股/A股历史行情、财报、期权链',
  '- 🧠 **分析策略** — 把你的策略想法发给我，我来分析',
  '',
  '> 💡 当前支持 **美股**（代码如 AAPL/SPY）和 **A股**（代码如 600519/000858）',
  '',
  '直接在对下面框发消息，或者用右侧面板快速操作。'
].join('\n')

/**
 * 获取股票显示名
 */
function stockDisplay(symbol) {
  const names = {
    // 美股
    'AAPL': 'Apple (苹果)',
    'SPY': 'SPDR S&P 500 ETF',
    'TSLA': 'Tesla (特斯拉)',
    'QQQ': 'Invesco QQQ Trust',
    'MSFT': 'Microsoft (微软)',
    'GOOGL': 'Alphabet (谷歌)',
    'AMZN': 'Amazon (亚马逊)',
    // A股
    '600519': '贵州茅台',
    '000858': '五粮液',
    '000333': '美的集团',
    '600036': '招商银行',
    '601318': '中国平安',
    '300750': '宁德时代',
    '000002': '万科A',
  }
  return names[symbol] || symbol
}

function isAStock(symbol) {
  return symbol.startsWith('0') || symbol.startsWith('3') || symbol.startsWith('6')
}

function getMarketLabel(symbol) {
  return isAStock(symbol) ? '🇨🇳 A股' : '🇺🇸 美股'
}

export function backtestReply(symbol = 'AAPL', strategyName = '双均线交叉', benchmark = 'SPY') {
  const isA = isAStock(symbol)
  const display = stockDisplay(symbol)
  const marketLabel = getMarketLabel(symbol)

  let backtestData, performanceRows

  if (isA) {
    performanceRows = [
      '| 指标 | 策略 | 沪深300（基准） |',
      '|------|------|------|',
      '| 总收益率 | **+62.3%** | +45.8% |',
      '| 年化收益率 | **+9.7%** | +7.3% |',
      '| 年化波动率 | 21.2% | **19.5%** |',
      '| 夏普比率 | **0.46** | 0.38 |',
      '| 最大回撤 | -18.6% | -22.1% |',
      '| 胜率 | 54% | — |',
      '| 交易次数 | 52 | — |',
    ]
    backtestData = {
      labels: ['2020', '2021', '2022', '2023', '2024', '2025'],
      strategy: [115, 145, 128, 152, 165, 162],
      benchmark: [127, 145, 118, 140, 158, 146],
      benchmarkLabel: '沪深300'
    }
  } else {
    performanceRows = [
      '| 指标 | 策略 | ' + benchmark + '（基准） |',
      '|------|------|------|',
      '| 总收益率 | **+78.0%** | +73.0% |',
      '| 年化收益率 | **+11.4%** | +10.8% |',
      '| 年化波动率 | 18.5% | **17.2%** |',
      '| 夏普比率 | **0.62** | 0.63 |',
      '| 最大回撤 | -15.2% | **-18.0%** |',
      '| 胜率 | 58% | — |',
      '| 交易次数 | 47 | — |',
    ]
    backtestData = {
      labels: ['2020', '2021', '2022', '2023', '2024', '2025'],
      strategy: [112, 140, 132, 154, 172, 178],
      benchmark: [116, 142, 124, 148, 171, 173],
      benchmarkLabel: benchmark
    }
  }

  return {
    content: [
      '## ✅ ' + marketLabel + ' **' + display + '（' + symbol + '）** ' + strategyName + '回测结果',
      '',
      '**回测区间：** 2020-01-01 → 2025-12-31',
      '',
      '### 绩效对比',
      '',
      performanceRows.join('\n'),
      '',
      '### 分析',
      '- 策略在趋势市中表现良好，' + (isA ? '2022年' : '2022年') + '熊市回撤可控',
      '- 策略夏普比率 ' + (isA ? '0.46' : '0.62') + '，风险调整后收益合理',
      (isA ? '- 跑赢沪深300指数约16个百分点' : ('- 跑赢 ' + benchmark + ' 约5个百分点')),
      '- **优化建议：** 可考虑增加 RSI 过滤减少假信号，或添加止损规则',
      '',
      '> ⚠️ 这是模拟回测数据，真实回测请让我联网获取最新数据后运行。'
    ].join('\n'),
    chartData: {
      labels: backtestData.labels,
      datasets: [
        {
          label: symbol + ' 策略',
          data: backtestData.strategy,
          borderColor: '#3b82f6',
          backgroundColor: 'transparent',
          tension: 0.3
        },
        {
          label: backtestData.benchmarkLabel,
          data: backtestData.benchmark,
          borderColor: '#ef4444',
          backgroundColor: 'transparent',
          tension: 0.3,
          borderDash: [5, 5]
        }
      ]
    }
  }
}

export function codeReply(symbol = 'AAPL') {
  const isA = isAStock(symbol)
  const tickerYF = isA ? symbol + '.SS' : symbol

  const code = [
    '```python',
    'import yfinance as yf',
    'import mplfinance as mpf',
    '',
    '# 获取数据（' + getMarketLabel(symbol) + '）',
    'symbol = "' + tickerYF + '"',
    'data = yf.download(symbol, start="2020-01-01", end="2025-12-31")',
    '',
    '# 绘制K线图（近60个交易日）',
    'mpf.plot(',
    '    data[-60:],',
    '    type="candle",',
    '    style="charles",',
    '    title=f"{symbol} K线图（近60日）",',
    '    volume=True,',
    '    mav=(20, 50),',
    '    figsize=(12, 8)',
    ')',
    '```'
  ].join('\n')

  return {
    content: [
      '## ✅ 代码已生成',
      '',
      code,
      '',
      '### 📝 说明',
      '- 使用 `yfinance` 获取 **' + stockDisplay(symbol) + '（' + symbol + '）** ' + getMarketLabel(symbol) + ' 数据',
      isA ? '- A股代码后需要加 `.SS`（上交所）或 `.SZ`（深交所），已自动处理' : '',
      '- `mplfinance` 绘制K线图，含20/50日均线',
      '- 包含成交量柱',
      '- 直接运行 `python 文件名.py` 即可出图',
      '',
      '> 需要我调整参数或生成其他类型的代码吗？直接说。'
    ].filter(Boolean).join('\n')
  }
}

export function dataReply(symbol = 'AAPL', type = 'price') {
  const isA = isAStock(symbol)
  const display = stockDisplay(symbol)
  const marketLabel = getMarketLabel(symbol)

  let basicInfo, priceData

  if (isA) {
    basicInfo = [
      '| 项目 | 内容 |',
      '|------|------|',
      '| 最新股价 | ¥186.30（模拟） |',
      '| 52周最高 | ¥215.88 |',
      '| 52周最低 | ¥148.50 |',
      '| 市盈率 (PE) | 22.8 |',
      '| 市净率 (PB) | 4.1 |',
      '| 股息率 | 1.85% |',
      '| 市值 | ¥2.34万亿 |',
      '| 日均成交量 | 3,200万 |',
    ].join('\n')
    priceData = {
      labels: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'],
      data: [172, 178, 165, 182, 190, 198, 205, 195, 188, 200, 210, 215]
    }
  } else {
    basicInfo = [
      '| 项目 | 内容 |',
      '|------|------|',
      '| 最新股价 | $198.67（模拟） |',
      '| 52周最高 | $237.23 |',
      '| 52周最低 | $164.08 |',
      '| 市盈率 (PE) | 28.5 |',
      '| 市净率 (PB) | 6.2 |',
      '| 股息率 | 0.52% |',
      '| 市值 | $3.02T |',
      '| 日均成交量 | 4,580万 |',
    ].join('\n')
    priceData = {
      labels: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'],
      data: [182, 188, 176, 193, 202, 210, 218, 206, 198, 215, 225, 237]
    }
  }

  const typeLabels = { price: '历史行情', financial: '财务数据', options: '期权链', info: '股票信息' }

  return {
    content: [
      '## 📈 ' + marketLabel + ' ' + typeLabels[type] + ' — **' + display + '（' + symbol + '）**',
      '',
      type === 'price' ? basicInfo : '（' + typeLabels[type] + '数据查询，当前为模拟数据）',
      '',
      '> 📅 数据最后更新：2026-05-19',
      '> 如需获取**真实实时数据**，告诉我一声，我帮你拉最新数据。'
    ].join('\n'),
    chartData: type === 'price' ? {
      labels: priceData.labels,
      datasets: [{
        label: symbol + ' 股价（2024）',
        data: priceData.data,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.3
      }]
    } : null
  }
}

export function analyzeReply() {
  return {
    content: [
      '## 🧠 策略分析结果',
      '',
      '### 策略思路解读',
      '你描述的是一种**趋势跟踪**策略 -- 均线金叉买入、死叉卖出，属于经典的趋势跟随逻辑。',
      '',
      '### ✅ 优势',
      '- **逻辑清晰**：规则简单，易于理解和执行',
      '- **捕捉趋势**：在单边上涨行情中收益不错',
      '- **无需频繁交易**：均线交叉频率较低，手续费影响小',
      '',
      '### ⚠️ 风险点',
      '1. **震荡市中反复止损**：均线频繁交叉导致连续亏损',
      '2. **滞后性**：均线本身是滞后指标，入场/出场都晚半拍',
      '3. **无风控机制**：纯信号交易缺少止损保护',
      '',
      '### 💡 优化建议',
      '- 增加 **RSI 过滤**（RSI>50才做多，避免震荡假信号）',
      '- 添加 **3% 硬止损** 控制单笔亏损',
      '- 考虑 **移动止损** 保护浮盈',
      '- 在 EMA 与 SMA 之间测试哪个更适合你的交易周期',
      '',
      '> 需要我帮你写出优化后的回测代码吗？'
    ].join('\n'),
    chartData: null
  }
}

export function defaultReply(text) {
  const preview = text.length > 50 ? text.slice(0, 50) + '...' : text
  return {
    content: [
      '收到你的需求 👀',
      '',
      '让我看看... 我会这样处理：',
      '',
      '1. **理解需求**：' + preview,
      '',
      '请更明确地告诉我你想做什么，例如：',
      '- "回测AAPL双均线策略"',
      '- "回测600519均线策略"（A股也能做）',
      '- "帮我写获取财报的代码"',
      '- "分析我这个策略的优缺点"',
      '',
      '或者直接用右侧面板的功能，更快！'
    ].join('\n')
  }
}
