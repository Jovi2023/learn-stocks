import { ref } from 'vue'
import { callKai } from '../utils/api.js'
import { welcomeMsg } from '../utils/responses.js'

export function useChat() {
  const messages = ref([{ role: 'bot', content: welcomeMsg }])
  const loading = ref(false)

  async function callAI(text) {
    loading.value = true
    try {
      const result = await callKai(text)
      messages.value.push({ role: 'bot', content: result.text })
    } catch (err) {
      messages.value.push({
        role: 'bot',
        content: '⚠️ 请求出错：' + err.message + '\n\n> 试试重新发送？',
      })
    } finally {
      loading.value = false
    }
  }

  // 推一条用户消息并触发 AI 回复
  function send(text) {
    const trimmed = (text || '').trim()
    if (!trimmed || loading.value) return
    messages.value.push({ role: 'user', content: trimmed })
    callAI(trimmed)
  }

  return { messages, loading, send }
}
