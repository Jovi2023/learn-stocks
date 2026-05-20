import { ref } from 'vue'
import { callKai } from '../utils/api.js'

// AI 接口超时上限。Kai 偶尔慢但 2 分钟没回基本可以判死了，
// 避免 fetch 挂在那回收不掉。
const REQUEST_TIMEOUT_MS = 120_000

const welcomeMsg = [
  '早上好 👋 我是 **凯**，你的量化助手。',
  '',
  '我可以帮你：',
  '- 📊 **跑回测** — 选择美股或A股，在右侧面板设置参数',
  '- 💻 **写代码** — 描述需求，我生成完整代码',
  '- 📈 **查数据** — 获取任意美股/A股历史行情、财报、期权链',
  '- 🧠 **分析策略** — 把你的策略想法发给我，我来分析',
  '',
  '> 💡 当前支持 **美股**（代码如 AAPL/SPY）和 **A股**（代码如 600519/000858）',
  '',
  '直接在对下面框发消息，或者用右侧面板快速操作。',
].join('\n')

export function useChat() {
  const messages = ref([{ role: 'bot', content: welcomeMsg }])
  const loading = ref(false)
  // 当前正在跑的请求的「用户主动取消」控制器；null 表示无进行中请求
  let activeController = null

  async function callAI(text) {
    loading.value = true
    const userCtrl = new AbortController()
    activeController = userCtrl
    // 用户取消 + 超时合成一个 signal；任一触发即 abort fetch
    const signal = AbortSignal.any([userCtrl.signal, AbortSignal.timeout(REQUEST_TIMEOUT_MS)])
    try {
      const result = await callKai(text, { signal })
      messages.value.push({ role: 'bot', content: result.text })
    } catch (err) {
      if (userCtrl.signal.aborted) {
        messages.value.push({ role: 'bot', content: '⏹ 已取消生成。' })
      } else if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
        messages.value.push({
          role: 'bot',
          content: `⏱ 请求超时（${REQUEST_TIMEOUT_MS / 1000}s 没等到响应）——稍后再试？`,
        })
      } else {
        messages.value.push({
          role: 'bot',
          content: '⚠️ 请求出错：' + err.message + '\n\n> 试试重新发送？',
        })
      }
    } finally {
      loading.value = false
      activeController = null
    }
  }

  // 推一条用户消息并触发 AI 回复
  function send(text) {
    const trimmed = (text || '').trim()
    if (!trimmed || loading.value) return
    messages.value.push({ role: 'user', content: trimmed })
    callAI(trimmed)
  }

  // 主动取消当前请求；无进行中请求时静默无操作
  function cancel() {
    if (activeController) activeController.abort()
  }

  return { messages, loading, send, cancel }
}
