import { ref } from 'vue'
import { callKai } from '../utils/api.js'
import { formatChatError } from '../utils/chatError.js'
import { CHART_API_PREFIX } from '../utils/chartSpec.js'
import { FACTOR_API_PREFIX, isFactorTask } from '../utils/factorPrompt.js'

// AI 接口超时上限。长回测/因子任务可达 10+ 分钟；15 分钟无回再判死。
const REQUEST_TIMEOUT_MS = 900_000

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
      const apiPrefix = isFactorTask(text)
        ? `${CHART_API_PREFIX}\n${FACTOR_API_PREFIX}`
        : CHART_API_PREFIX
      const result = await callKai(`${apiPrefix}\n\n${text}`, { signal })
      messages.value.push({ role: 'bot', content: result.text })
    } catch (err) {
      if (userCtrl.signal.aborted) {
        messages.value.push({ role: 'bot', content: '⏹ 已取消生成。' })
      } else {
        messages.value.push({
          role: 'bot',
          content: formatChatError(err, { timeoutSec: REQUEST_TIMEOUT_MS / 1000 }),
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

  // 用本地存档替换当前对话；AI 请求进行中时不操作
  function restore(storedMessages) {
    if (loading.value) return { ok: false, reason: 'loading' }
    messages.value = storedMessages.map(({ role, content }) => ({ role, content }))
    return { ok: true }
  }

  return { messages, loading, send, cancel, restore }
}
