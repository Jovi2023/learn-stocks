// CORS 代理 + API 路由
// 监听 18888 端口：
//   /api/* → GitHub 代理 (18889)
//   其他    → OpenClaw Gateway (18789)

const http = require('http')
const https = require('https')

const GATEWAY_PORT = 18789
const GITHUB_PROXY_PORT = 18889
const PROXY_PORT = 18888

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', '*')
  res.setHeader('Access-Control-Max-Age', '86400')

  // Handle OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  // Route /api/* to GitHub proxy
  if (req.url.startsWith('/api/')) {
    forwardTo(GITHUB_PROXY_PORT, req, res)
    return
  }

  // Forward to Gateway
  forwardTo(GATEWAY_PORT, req, res)
})

function forwardTo(targetPort, req, res) {
  const options = {
    hostname: '127.0.0.1',
    port: targetPort,
    path: req.url,
    method: req.method,
    headers: req.headers
  }

  const proxyReq = http.request(options, (proxyRes) => {
    // Copy all response headers
    for (const [key, value] of Object.entries(proxyRes.headers)) {
      res.setHeader(key, value)
    }
    // Override CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', '*')

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
  console.log(`  otherwise → gateway     :${GATEWAY_PORT}`)
})
