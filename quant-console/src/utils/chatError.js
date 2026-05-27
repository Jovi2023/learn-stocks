// 把 fetch / 网关错误翻译成用户能操作的提示（见 AGENTS 审计 #10）

export function formatChatError(err, { timeoutSec = 300 } = {}) {
  const msg = err?.message || String(err)

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return [
      '📡 **设备已离线**',
      '',
      '请检查 Wi‑Fi / 网络后再发送。',
    ].join('\n')
  }

  // 浏览器在连不上、CORS 被拒、隧道断了时统一抛 Failed to fetch
  if (msg === 'Failed to fetch' || err?.name === 'TypeError') {
    return [
      '🔌 **无法连接后端**',
      '',
      '生产环境依赖 `api.jovi-trade.cn`（Mac 上的 frpc + cors-proxy）。常见原因：',
      '- 未运行 `bash start-tunnel.sh`',
      '- Mac 休眠/关机，隧道已断',
      '',
      '本地开发：先起隧道，再 `npm run dev`（走 vite proxy → 127.0.0.1:18888）。',
    ].join('\n')
  }

  if (/请求过于频繁|rate_limit/i.test(msg) || /\(429\)/.test(msg)) {
    return [
      '⏳ **请求过于频繁**',
      '',
      '已触发限流保护，请稍等一分钟后再试。',
    ].join('\n')
  }

  if (/API 请求失败 \(401\)/.test(msg)) {
    return [
      '🔐 **鉴权失败（401）**',
      '',
      'Gateway token 可能已轮换，需检查 Mac 上 `~/.openclaw/kai.env` 与 cors-proxy 是否一致。',
    ].join('\n')
  }

  if (/API 请求失败 \(5\d{2}\)/.test(msg)) {
    return [
      `⚠️ **服务端异常**：${msg}`,
      '',
      '后端可能未启动或网关异常，稍后再试。',
    ].join('\n')
  }

  if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
    return `⏱ 请求超时（${timeoutSec}s 没等到响应）——稍后再试？`
  }

  return `⚠️ 请求出错：${msg}\n\n> 试试重新发送？`
}
