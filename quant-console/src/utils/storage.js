// 对话持久化存储 - 通过本地代理保存到 GitHub Issues
// Token 保存在 Mac 本地，浏览器不直接调 GitHub API

import { API_BASE_URL } from './api.js'

const SAVE_API_URL = `${API_BASE_URL}/api/save-chat`

/**
 * 保存对话到 GitHub Issues
 */
export async function saveChatToGitHub(title, messages) {
  const response = await fetch(SAVE_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, messages })
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error || `保存失败 (${response.status})`)
  }

  return response.json()
}

/**
 * 从 GitHub Issues 加载历史对话列表
 * 直接调 GitHub API（只读，不需要 token）
 */
export async function loadChatHistory() {
  const response = await fetch(
    'https://api.github.com/repos/Jovi2023/learn-stocks/issues?labels=quant-console,chat-log&state=all&sort=created&direction=desc&per_page=20',
    {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'kai-quant-console'
      }
    }
  )

  if (!response.ok) {
    throw new Error(`加载失败 (${response.status})`)
  }

  return response.json()
}
