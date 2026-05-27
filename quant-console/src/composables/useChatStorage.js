import { ref } from 'vue'
import { saveLocalChat, listLocalChats, getLocalChat, deleteLocalChat } from '../utils/localStore.js'
import { saveChatToGitHub } from '../utils/storage.js'

function defaultTitle() {
  return '量化分析 ' + new Date().toLocaleDateString('zh-CN')
}

function strippedMessages(messages) {
  return messages.value.filter((m) => m.role !== 'system')
}

export function useChatStorage() {
  const savingChat = ref(false)
  const uploadingChat = ref(false)
  const showHistory = ref(false)
  const historyList = ref([])
  const loadingHistory = ref(false)

  async function save(messages) {
    const msgs = strippedMessages(messages)
    if (msgs.length <= 1) {
      messages.value.push({ role: 'bot', content: '⚠️ 还没有可保存的对话内容。' })
      return
    }
    const title = prompt('给这段对话起个标题（保存到本地浏览器）：', defaultTitle())
    if (!title) return
    savingChat.value = true
    try {
      await saveLocalChat(title, msgs)
      messages.value.push({
        role: 'bot',
        content: `✅ 已保存到本地浏览器（IndexedDB）。\n\n> 数据只在你当前浏览器里，换电脑 / 隐身模式看不到。点 ☁️ 可上传一份到云端备份/分享。`,
      })
    } catch (err) {
      messages.value.push({ role: 'bot', content: '⚠️ 保存失败：' + err.message })
    } finally {
      savingChat.value = false
    }
  }

  async function upload(messages) {
    const msgs = strippedMessages(messages)
    if (msgs.length <= 1) {
      messages.value.push({ role: 'bot', content: '⚠️ 还没有可上传的对话内容。' })
      return
    }
    const title = prompt('云端备份标题（公开存到 GitHub Issues）：', defaultTitle())
    if (!title) return
    uploadingChat.value = true
    try {
      const result = await saveChatToGitHub(title, msgs)
      messages.value.push({
        role: 'bot',
        content: `☁️ 已上传到云端备份：\n\n📎 [${title}](${result.url})\n🎫 Issue #${result.number}`,
      })
    } catch (err) {
      messages.value.push({ role: 'bot', content: '⚠️ 上传失败：' + err.message })
    } finally {
      uploadingChat.value = false
    }
  }

  async function loadHistory() {
    showHistory.value = true
    loadingHistory.value = true
    try {
      historyList.value = await listLocalChats()
    } catch (err) {
      historyList.value = []
      console.error('加载本地历史失败:', err)
    } finally {
      loadingHistory.value = false
    }
  }

  async function removeFromHistory(id) {
    await deleteLocalChat(id)
    historyList.value = historyList.value.filter((h) => h.id !== id)
  }

  function closeHistory() {
    showHistory.value = false
  }

  async function restoreFromHistory(id, { messages, restore, loading }) {
    const chat = await getLocalChat(id)
    if (!chat?.messages?.length) return

    const hasUserMsg = messages.value.some((m) => m.role === 'user')
    if (hasUserMsg && !confirm(`恢复「${chat.title}」会替换当前对话，继续？`)) return

    if (loading.value) {
      messages.value.push({ role: 'bot', content: '⚠️ 等 AI 回复完再恢复历史。' })
      return
    }

    restore(chat.messages)
    showHistory.value = false
  }

  return {
    savingChat,
    uploadingChat,
    showHistory,
    historyList,
    loadingHistory,
    save,
    upload,
    loadHistory,
    removeFromHistory,
    closeHistory,
    restoreFromHistory,
  }
}
