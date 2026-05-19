// GitHub Issues 代理服务
// 接收控制台页面的请求，用你的 Token 创建 GitHub Issue
// Token 只存在你的 Mac 上，不暴露到浏览器

const http = require('http')

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || ''
const REPO_OWNER = 'Jovi2023'
const REPO_NAME = 'learn-stocks'
const PROXY_PORT = 18889

if (!GITHUB_TOKEN) {
  console.error('❌ 请设置 GITHUB_TOKEN 环境变量')
  console.error('   export GITHUB_TOKEN=ghp_xxxxxxxxxxxx')
  process.exit(1)
}

const server = http.createServer((req, res) => {
  // CORS headers (允许控制台跨域调用)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Max-Age', '86400')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  if (req.method !== 'POST' || req.url !== '/api/save-chat') {
    res.writeHead(404)
    res.end(JSON.stringify({ error: 'Not found' }))
    return
  }

  let body = ''
  req.on('data', chunk => body += chunk)
  req.on('end', async () => {
    try {
      const data = JSON.parse(body)
      const { title, messages } = data

      if (!title || !messages || !messages.length) {
        res.writeHead(400)
        res.end(JSON.stringify({ error: '需要 title 和 messages' }))
        return
      }

      // 格式化对话内容为 Issue body
      const date = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
      let issueBody = `## ${title}\n\n`
      issueBody += `**保存时间：** ${date}\n`
      issueBody += `**消息数：** ${messages.length}\n\n`
      issueBody += `---\n\n`

      for (const msg of messages) {
        const role = msg.role === 'user' ? '👤 你' : '🜁 凯'
        issueBody += `### ${role}\n\n${msg.content}\n\n`
      }

      // 调用 GitHub API 创建 Issue
      const githubRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
          'User-Agent': 'kai-quant-console'
        },
        body: JSON.stringify({
          title: `💬 ${title}`,
          body: issueBody,
          labels: ['quant-console', 'chat-log']
        })
      })

      const result = await githubRes.json()

      if (!githubRes.ok) {
        res.writeHead(githubRes.status)
        res.end(JSON.stringify({ error: result.message || 'GitHub API error' }))
        return
      }

      console.log(`✅ Issue created: ${result.html_url}`)
      res.writeHead(200)
      res.end(JSON.stringify({
        success: true,
        url: result.html_url,
        number: result.number
      }))

    } catch (err) {
      console.error('❌ Error:', err.message)
      res.writeHead(500)
      res.end(JSON.stringify({ error: err.message }))
    }
  })
})

server.listen(PROXY_PORT, () => {
  console.log(`📝 GitHub Issues 代理运行中`)
  console.log(`   http://127.0.0.1:${PROXY_PORT}/api/save-chat`)
  console.log(`   → 创建 Issue 到 ${REPO_OWNER}/${REPO_NAME}`)
})
