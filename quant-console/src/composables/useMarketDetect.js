// A 股：6 位数字（沪 6xx / 深 0xx·3xx 等）；其余按美股 ticker 处理
const CN_STOCK_RE = /^\d{6}$/

const QUICK_US = ['AAPL', 'SPY', 'TSLA', 'QQQ']
const QUICK_CN = ['600519', '000858', '300750', '000333']

export function detectMarket(symbol) {
  const s = (symbol || '').trim()
  return CN_STOCK_RE.test(s) ? 'cn' : 'us'
}

export function quickSymbols(market) {
  return market === 'cn' ? QUICK_CN : QUICK_US
}
