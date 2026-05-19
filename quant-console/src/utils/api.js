// 量化控制台 API 配置
// Tunnel URL 每次启动 Serveo 会变，需要更新这里
// 后续可以考虑固定的域名方案（serveo 付费版）

export const API_CONFIG = {
  // Serveo 隧道公网 URL
  baseUrl: 'http://101.32.186.116:8888',
  // OpenClaw Gateway auth token
  get token() {
    return '7c1f4adfe52e2f016d2329e9c6304e20a1bb5540b7667349'
  },
  // 默认 agent ID
  agentId: 'main'
}

/**
 * 调用 Kai 处理量化需求
 * @param {string} input - 用户输入的内容
 * @returns {Promise<{text: string, chartData?: object}>}
 */
export async function callKai(input) {
  const response = await fetch(`${API_CONFIG.baseUrl}/v1/responses`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_CONFIG.token}`,
      'Content-Type': 'application/json',
      'x-openclaw-agent-id': API_CONFIG.agentId
    },
    body: JSON.stringify({
      model: 'openclaw',
      input: input
    })
  })

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}))
    throw new Error(errData?.error?.message || `API 请求失败 (${response.status})`)
  }

  const data = await response.json()

  // 从 Responses API 结构提取文本
  const items = data?.output || []
  let text = ''
  for (const item of items) {
    const content = item?.content || []
    for (const c of content) {
      if (c?.type === 'output_text') {
        text += c.text || ''
      }
    }
  }

  return {
    text: text || '(没有回复内容)',
    raw: data
  }
}
