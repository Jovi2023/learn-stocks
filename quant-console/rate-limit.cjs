// 固定窗口 per-key 限流（单进程内存）。防刷 Gateway / GitHub API 额度。

function envInt(name, fallback) {
  const n = parseInt(process.env[name], 10)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

const WINDOW_MS = envInt('RATE_LIMIT_WINDOW_MS', 60_000)

function createRateLimiter(maxPerWindow) {
  const buckets = new Map()

  function prune(now) {
    if (buckets.size <= 10_000) return
    for (const [k, b] of buckets) {
      if (now >= b.resetAt) buckets.delete(k)
    }
  }

  return {
    check(key) {
      const now = Date.now()
      prune(now)
      let b = buckets.get(key)
      if (!b || now >= b.resetAt) {
        b = { count: 0, resetAt: now + WINDOW_MS }
        buckets.set(key, b)
      }
      b.count += 1
      const retryAfterSec = Math.max(1, Math.ceil((b.resetAt - now) / 1000))
      if (b.count > maxPerWindow) {
        return { allowed: false, retryAfterSec }
      }
      return { allowed: true, retryAfterSec: 0 }
    },
  }
}

function clientIp(req) {
  const xff = req.headers['x-forwarded-for']
  if (xff) {
    const first = xff.split(',')[0].trim()
    if (first) return first
  }
  return req.socket?.remoteAddress || 'unknown'
}

function rateLimitJson() {
  return JSON.stringify({
    error: {
      message: '请求过于频繁，请稍后再试',
      type: 'rate_limit_exceeded',
    },
  })
}

module.exports = {
  createRateLimiter,
  clientIp,
  rateLimitJson,
  kaiLimiter: () => createRateLimiter(envInt('RATE_LIMIT_KAI_PER_MIN', 30)),
  apiLimiter: () => createRateLimiter(envInt('RATE_LIMIT_API_PER_MIN', 10)),
}
