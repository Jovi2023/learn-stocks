// 对话上云 - 默认走 IndexedDB（见 localStore.js），这里只在用户手动点 ☁️ 上传时调用
//
// endpoint 选择顺序：
//   1. VITE_GITHUB_PROXY_URL（build 时注入，指向 Cloudflare Worker）—— P2 ③ 之后的主路径
//   2. ${API_BASE_URL}/api/save-chat —— fallback 到 frp → Mac:18888 cors-proxy → github-proxy.cjs
// 二者后端都需要在自己一侧持有 GitHub PAT，浏览器永远不带 token

import { API_BASE_URL } from './api.js'

const SAVE_API_URL =
  import.meta.env.VITE_GITHUB_PROXY_URL || `${API_BASE_URL}/api/save-chat`

export async function saveChatToGitHub(title, messages) {
  const response = await fetch(SAVE_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, messages }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error || `保存失败 (${response.status})`)
  }

  return response.json()
}
