// Worker 边缘限流（per-isolate 内存；冷启动重置，够挡突发滥用）

const buckets = new Map()

export function checkRateLimit(key, { windowMs = 60_000, maxPerWindow = 10 } = {}) {
  const now = Date.now()
  if (buckets.size > 5000) {
    for (const [k, b] of buckets) {
      if (now >= b.resetAt) buckets.delete(k)
    }
  }

  let b = buckets.get(key)
  if (!b || now >= b.resetAt) {
    b = { count: 0, resetAt: now + windowMs }
    buckets.set(key, b)
  }
  b.count += 1
  const retryAfterSec = Math.max(1, Math.ceil((b.resetAt - now) / 1000))
  if (b.count > maxPerWindow) {
    return { allowed: false, retryAfterSec }
  }
  return { allowed: true, retryAfterSec: 0 }
}
