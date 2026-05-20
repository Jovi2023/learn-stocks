import { ref } from 'vue'
import { saveChatToGitHub, loadChatHistory } from '../utils/storage.js'

export function useChatStorage() {
  const savingChat = ref(false)
  const showHistory = ref(false)
  const historyList = ref([])
  const loadingHistory = ref(false)

  async function saveChat(title, messages) {
    savingChat.value = true
    try {
      return await saveChatToGitHub(title, messages)
    } finally {
      savingChat.value = false
    }
  }

  async function loadHistory() {
    showHistory.value = true
    loadingHistory.value = true
    try {
      historyList.value = await loadChatHistory()
    } catch (err) {
      historyList.value = []
      console.error('加载历史失败:', err)
    } finally {
      loadingHistory.value = false
    }
  }

  function closeHistory() {
    showHistory.value = false
  }

  return {
    savingChat,
    showHistory,
    historyList,
    loadingHistory,
    saveChat,
    loadHistory,
    closeHistory,
  }
}
