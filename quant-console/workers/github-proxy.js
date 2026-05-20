// Cloudflare Worker：替代 Mac 上的 github-proxy.cjs
// 单一 endpoint：POST /api/save-chat —— 用 fine-grained PAT 在固定 repo 建 Issue
//
// 部署需要：
//   1. wrangler secret put GITHUB_TOKEN   —— fine-grained PAT，仅 Issues:write
//   2. wrangler deploy
//   3. 拿到 *.workers.dev URL，喂给前端 .env.production 的 VITE_GITHUB_PROXY_URL
//
// 与 .cjs 版本的差异：CORS 不再 `*`，按白名单收紧；新增 payload 校验避免被滥用灌爆 Issues。

const DEFAULT_ALLOWED = [
  'https://jovi2023.github.io',
  'https://console.jovi-trade.cn',
  'http://localhost:5173',
  'http://localhost:5174',
]

const MAX_TITLE_LEN = 200
const MAX_MESSAGES = 100
const MAX_CONTENT_LEN = 50_000

function parseAllowedOrigins(env) {
  if (env.ALLOWED_ORIGINS) {
    return env.ALLOWED_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean)
  }
  return DEFAULT_ALLOWED
}

function corsHeaders(origin, allowed) {
  // 严格白名单：未匹配的 origin 不回显，浏览器自然拒收
  const ok = origin && allowed.includes(origin)
  return {
    'Access-Control-Allow-Origin': ok ? origin : 'null',
    Vary: 'Origin',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  }
}

function jsonResponse(status, body, cors) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors },
  })
}

function validatePayload(data) {
  if (!data || typeof data !== 'object') return '请求体必须是 JSON 对象'
  const { title, messages } = data
  if (typeof title !== 'string' || !title.trim() || title.length > MAX_TITLE_LEN) {
    return `title 必须是 1-${MAX_TITLE_LEN} 字符的字符串`
  }
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) {
    return `messages 必须是长度 1-${MAX_MESSAGES} 的数组`
  }
  for (const m of messages) {
    if (!m || typeof m.role !== 'string' || typeof m.content !== 'string') {
      return '每条 message 需要 role 和 content 字符串字段'
    }
    if (m.content.length > MAX_CONTENT_LEN) {
      return `单条消息内容超长（限 ${MAX_CONTENT_LEN} 字符）`
    }
  }
  return null
}

function formatIssueBody(title, messages) {
  const date = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
  let body = `## ${title}\n\n`
  body += `**保存时间：** ${date}\n`
  body += `**消息数：** ${messages.length}\n\n`
  body += `---\n\n`
  for (const msg of messages) {
    const role = msg.role === 'user' ? '👤 你' : '🜁 凯'
    body += `### ${role}\n\n${msg.content}\n\n`
  }
  return body
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const origin = request.headers.get('Origin') || ''
    const allowed = parseAllowedOrigins(env)
    const cors = corsHeaders(origin, allowed)

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors })
    }

    if (request.method !== 'POST' || url.pathname !== '/api/save-chat') {
      return jsonResponse(404, { error: 'Not found' }, cors)
    }

    // origin 为空（curl 等）放行 —— 同源 / 非浏览器场景；origin 非空必须在白名单
    if (origin && !allowed.includes(origin)) {
      return jsonResponse(403, { error: 'Origin not allowed' }, cors)
    }

    if (!env.GITHUB_TOKEN) {
      return jsonResponse(500, { error: 'GITHUB_TOKEN missing on server' }, cors)
    }

    let data
    try {
      data = await request.json()
    } catch (_) {
      return jsonResponse(400, { error: '请求体必须是合法 JSON' }, cors)
    }

    const invalid = validatePayload(data)
    if (invalid) return jsonResponse(400, { error: invalid }, cors)

    const owner = env.REPO_OWNER || 'Jovi2023'
    const repo = env.REPO_NAME || 'learn-stocks'

    const ghRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'kai-quant-console-worker',
        Accept: 'application/vnd.github+json',
      },
      body: JSON.stringify({
        title: `💬 ${data.title}`,
        body: formatIssueBody(data.title, data.messages),
        labels: ['quant-console', 'chat-log'],
      }),
    })

    const result = await ghRes.json().catch(() => ({}))

    if (!ghRes.ok) {
      return jsonResponse(ghRes.status, { error: result.message || 'GitHub API error' }, cors)
    }

    return jsonResponse(200, { success: true, url: result.html_url, number: result.number }, cors)
  },
}
