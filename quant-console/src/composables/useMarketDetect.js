// A 股代码前缀（沪市 6xx、深市 0xx、创业板 3xx）
const CN_PREFIXES = ['0', '3', '6']

const QUICK_US = ['AAPL', 'SPY', 'TSLA', 'QQQ']
const QUICK_CN = ['600519', '000858', '300750', '000333']

export function detectMarket(symbol) {
  return symbol && CN_PREFIXES.some((p) => symbol.startsWith(p)) ? 'cn' : 'us'
}

export function quickSymbols(market) {
  return market === 'cn' ? QUICK_CN : QUICK_US
}
