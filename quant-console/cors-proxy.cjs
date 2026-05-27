// CORS 代理 + API 路由 + 鉴权注入
// 监听 18888 端口：
//   /api/* → GitHub 代理 (18889) — 它自己处理 GitHub token
//   其他    → OpenClaw Gateway (18789) — 由本进程注入 Bearer token
//
// 启动前置：
//   export KAI_API_TOKEN=xxxx    或   echo 'KAI_API_TOKEN=xxxx' > ~/.openclaw/kai.env
//   start-tunnel.sh 已经会自动加载 kai.env

const http = require('http')
const fs = require('fs')
const os = require('os')
const path = require('path')
const {
  clientIp,
  rateLimitJson,
  kaiLimiter,
  apiLimiter,
} = require('./rate-limit.cjs')

const GATEWAY_PORT = 18789
const GITHUB_PROXY_PORT = 18889
const PROXY_PORT = 18888

// 优先用 env，缺失则从 ~/.openclaw/kai.env 读
// 避免 `KAI_API_TOKEN=xxx node ...` 这种命令行写法暴露在 ps 输出里
function loadKaiToken() {
  if (process.env.KAI_API_TOKEN) return process.env.KAI_API_TOKEN
  const envFile = path.join(os.homedir(), '.openclaw', 'kai.env')
  try {
    const content = fs.readFileSync(envFile, 'utf8')
    const m = content.match(/^\s*KAI_API_TOKEN\s*=\s*(.+?)\s*$/m)
    if (m) return m[1].trim()
  } catch (_) {
    // 文件不存在 / 不可读，下面会统一报错退出
  }
  return ''
}

const KAI_API_TOKEN = loadKaiToken()
const DEFAULT_AGENT_ID = process.env.KAI_AGENT_ID || 'main'

// 与 Cloudflare Worker 白名单对齐；可通过 ALLOWED_ORIGINS 环境变量覆盖（逗号分隔）
const DEFAULT_ALLOWED_ORIGINS = [
  'https://jovi2023.github.io',
  'https://console.jovi-trade.cn',
  'http://console.jovi-trade.cn', // 未开 Enforce HTTPS 时浏览器 Origin 为 http
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
]

function parseAllowedOrigins() {
  if (process.env.ALLOWED_ORIGINS) {
    return process.env.ALLOWED_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean)
  }
  return DEFAULT_ALLOWED_ORIGINS
}

const ALLOWED_ORIGINS = parseAllowedOrigins()
const limitKai = kaiLimiter()
const limitApi = apiLimiter()

function corsHeaders(origin) {
  const ok = origin && ALLOWED_ORIGINS.includes(origin)
  return {
    'Access-Control-Allow-Origin': ok ? origin : 'null',
    Vary: 'Origin',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-openclaw-agent-id',
    'Access-Control-Max-Age': '86400',
  }
}

if (!KAI_API_TOKEN) {
  console.error('❌ 找不到 KAI_API_TOKEN。请二选一：')
  console.error('   echo "KAI_API_TOKEN=<your-token>" > ~/.openclaw/kai.env  &&  chmod 600 ~/.openclaw/kai.env')
  console.error('   或在启动 shell 中  export KAI_API_TOKEN=<your-token>')
  process.exit(1)
}

const server = http.createServer((req, res) => {
  const origin = req.headers.origin
  const cors = corsHeaders(origin)

  if (req.method === 'OPTIONS') {
    for (const [key, value] of Object.entries(cors)) {
      res.setHeader(key, value)
    }
    res.writeHead(204)
    res.end()
    return
  }

  const ip = clientIp(req)
  const isApi = req.url.startsWith('/api/')
  const rl = (isApi ? limitApi : limitKai).check(`${isApi ? 'api' : 'kai'}:${ip}`)
  if (!rl.allowed) {
    for (const [key, value] of Object.entries(cors)) {
      res.setHeader(key, value)
    }
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Retry-After', String(rl.retryAfterSec))
    res.writeHead(429)
    res.end(rateLimitJson(rl.retryAfterSec))
    return
  }

  if (isApi) {
    forwardTo(GITHUB_PROXY_PORT, req, res, { injectAuth: false, cors })
    return
  }

  forwardTo(GATEWAY_PORT, req, res, { injectAuth: true, cors })
})

function forwardTo(targetPort, req, res, { injectAuth, cors }) {
  // 浅拷贝避免污染原对象；Node 已经把 header key 全部小写化
  const headers = { ...req.headers }

  if (injectAuth) {
    // 防御性：浏览器塞过来的 Authorization 一律丢弃，
    // 真实 token 只来自本进程环境变量
    delete headers.authorization
    delete headers['proxy-authorization']
    headers['authorization'] = `Bearer ${KAI_API_TOKEN}`
    if (!headers['x-openclaw-agent-id']) {
      headers['x-openclaw-agent-id'] = DEFAULT_AGENT_ID
    }
  }

  // 上游收到的 host 应该是它自己监听的本地地址
  headers['host'] = `127.0.0.1:${targetPort}`

  const options = {
    hostname: '127.0.0.1',
    port: targetPort,
    path: req.url,
    method: req.method,
    headers
  }

  const proxyReq = http.request(options, (proxyRes) => {
    for (const [key, value] of Object.entries(proxyRes.headers)) {
      res.setHeader(key, value)
    }
    for (const [key, value] of Object.entries(cors)) {
      res.setHeader(key, value)
    }

    res.writeHead(proxyRes.statusCode)
    proxyRes.pipe(res)
  })

  proxyReq.on('error', (err) => {
    console.error(`Proxy error (port ${targetPort}):`, err.message)
    res.writeHead(502)
    res.end(JSON.stringify({ error: { message: 'Backend unavailable', type: 'proxy_error' } }))
  })

  req.pipe(proxyReq)
}

server.listen(PROXY_PORT, () => {
  console.log(`CORS proxy running on port ${PROXY_PORT}`)
  console.log(`  /api/*    → github proxy :${GITHUB_PROXY_PORT}`)
  console.log(`  otherwise → gateway     :${GATEWAY_PORT} (auth injected by proxy)`)
})
