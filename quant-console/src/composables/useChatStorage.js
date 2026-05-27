import { ref } from 'vue'
import { saveLocalChat, listLocalChats, getLocalChat, deleteLocalChat } from '../utils/localStore.js'
import { saveChatToGitHub } from '../utils/storage.js'

function defaultTitle() {
  return '量化分析 ' + new Date().toLocaleDateString('zh-CN')
}

/** @param {import('vue').Ref<Array<{role:string,content:string}>>} chatMessages */
export function useChatStorage(chatMessages) {
  const savingChat = ref(false)
  const uploadingChat = ref(false)
  const showHistory = ref(false)
  const historyList = ref([])
  const loadingHistory = ref(false)

  const titlePrompt = ref({
    open: false,
    mode: null,
    title: '',
  })

  function strippedMessages() {
    const list = chatMessages.value
    if (!Array.isArray(list)) return []
    return list.filter((m) => m.role !== 'system')
  }

  function pushBotMessage(content) {
    if (!Array.isArray(chatMessages.value)) return
    chatMessages.value.push({ role: 'bot', content })
  }

  function ensureSaveable() {
    const msgs = strippedMessages()
    if (msgs.length <= 1) {
      pushBotMessage('⚠️ 还没有可保存的对话内容。')
      return false
    }
    return true
  }

  async function runTitleAction({ title, loadingRef, run, onSuccess, failPrefix }) {
    loadingRef.value = true
    try {
      const msgs = strippedMessages()
      const result = await run(title, msgs)
      pushBotMessage(onSuccess(result, title))
    } catch (err) {
      pushBotMessage(failPrefix + err.message)
    } finally {
      loadingRef.value = false
    }
  }

  function openTitlePrompt(mode) {
    if (!ensureSaveable()) return
    titlePrompt.value = { open: true, mode, title: defaultTitle() }
  }

  function closeTitlePrompt() {
    titlePrompt.value = { open: false, mode: null, title: '' }
  }

  function setTitlePromptTitle(title) {
    titlePrompt.value = { ...titlePrompt.value, title }
  }

  async function confirmTitlePrompt() {
    const { open, mode, title } = titlePrompt.value
    if (!open) return
    const trimmed = (title || '').trim()
    if (!trimmed) return

    const modeCopy = mode
    closeTitlePrompt()

    if (modeCopy === 'save') {
      await runTitleAction({
        title: trimmed,
        loadingRef: savingChat,
        run: (t, msgs) => saveLocalChat(t, msgs),
        onSuccess: () =>
          '✅ 已保存到本地浏览器（IndexedDB）。\n\n> 数据只在你当前浏览器里，换电脑 / 隐身模式看不到。点 ☁️ 可上传一份到云端备份/分享。',
        failPrefix: '⚠️ 保存失败：',
      })
    } else if (modeCopy === 'upload') {
      await runTitleAction({
        title: trimmed,
        loadingRef: uploadingChat,
        run: (t, msgs) => saveChatToGitHub(t, msgs),
        onSuccess: (result, t) =>
          `☁️ 已上传到云端备份：\n\n📎 [${t}](${result.url})\n🎫 Issue #${result.number}`,
        failPrefix: '⚠️ 上传失败：',
      })
    }
  }

  function save() {
    openTitlePrompt('save')
  }

  function upload() {
    openTitlePrompt('upload')
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

  async function restoreFromHistory(id, { restore, loading }) {
    const chat = await getLocalChat(id)
    if (!chat?.messages?.length) return

    const hasUserMsg = chatMessages.value.some((m) => m.role === 'user')
    if (hasUserMsg && !confirm(`恢复「${chat.title}」会替换当前对话，继续？`)) return

    if (loading.value) {
      pushBotMessage('⚠️ 等 AI 回复完再恢复历史。')
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
    titlePrompt,
    save,
    upload,
    closeTitlePrompt,
    setTitlePromptTitle,
    confirmTitlePrompt,
    loadHistory,
    removeFromHistory,
    closeHistory,
    restoreFromHistory,
  }
}
