// CORS 代理 - 在 Serveo 隧道和 OpenClaw Gateway 之间添加 CORS 支持
// 监听 18888 端口，转发到 18789，并添加 CORS header

const http = require('http')
const https = require('https')

const GATEWAY_PORT = 18789
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

  // Forward to Gateway
  const options = {
    hostname: '127.0.0.1',
    port: GATEWAY_PORT,
    path: req.url,
    method: req.method,
    headers: req.headers
  }

  const proxyReq = http.request(options, (proxyRes) => {
    // Copy all response headers
    for (const [key, value] of Object.entries(proxyRes.headers)) {
      res.setHeader(key, value)
    }
    // Override CORS headers (ensure they're set)
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', '*')

    res.writeHead(proxyRes.statusCode)
    proxyRes.pipe(res)
  })

  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err.message)
    res.writeHead(502)
    res.end(JSON.stringify({ error: { message: 'Gateway unavailable', type: 'proxy_error' } }))
  })

  req.pipe(proxyReq)
})

server.listen(PROXY_PORT, () => {
  console.log(`CORS proxy running on port ${PROXY_PORT} → gateway ${GATEWAY_PORT}`)
})
