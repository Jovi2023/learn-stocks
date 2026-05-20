// 量化控制台 API 配置
// 鉴权由 cors-proxy.cjs 在服务端注入，前端绝不持有 token。
// 见 .cursor/rules/security.mdc 第 1 条。

export const API_CONFIG = {
  baseUrl: 'https://api.jovi-trade.cn',
  agentId: 'main'
}

/**
 * 调用 Kai 处理量化需求
 * @param {string} input - 用户输入的内容
 * @returns {Promise<{text: string, raw: object}>}
 */
export async function callKai(input) {
  const response = await fetch(`${API_CONFIG.baseUrl}/v1/responses`, {
    method: 'POST',
    headers: {
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
