import { ref } from 'vue'
import { saveLocalChat, listLocalChats, getLocalChat, deleteLocalChat } from '../utils/localStore.js'
import { saveChatToGitHub } from '../utils/storage.js'

function defaultTitle() {
  return '量化分析 ' + new Date().toLocaleDateString('zh-CN')
}

function strippedMessages(messages) {
  const list = messages?.value ?? messages
  if (!Array.isArray(list)) return []
  return list.filter((m) => m.role !== 'system')
}

function pushBotMessage(messages, content) {
  const ref = messages?.value !== undefined ? messages : null
  if (ref) ref.value.push({ role: 'bot', content })
}

function ensureSaveable(messages) {
  const msgs = strippedMessages(messages)
  if (msgs.length <= 1) {
    pushBotMessage(messages, '⚠️ 还没有可保存的对话内容。')
    return null
  }
  return msgs
}

async function runTitleAction({ messages, title, loadingRef, run, onSuccess, failPrefix }) {
  loadingRef.value = true
  try {
    const msgs = strippedMessages(messages)
    const result = await run(title, msgs)
    pushBotMessage(messages, onSuccess(result, title))
  } catch (err) {
    pushBotMessage(messages, failPrefix + err.message)
  } finally {
    loadingRef.value = false
  }
}

export function useChatStorage() {
  const savingChat = ref(false)
  const uploadingChat = ref(false)
  const showHistory = ref(false)
  const historyList = ref([])
  const loadingHistory = ref(false)

  const titlePrompt = ref({
    open: false,
    mode: null,
    title: '',
    messagesRef: null,
  })

  function openTitlePrompt(mode, messages) {
    if (!ensureSaveable(messages)) return
    titlePrompt.value = {
      open: true,
      mode,
      title: defaultTitle(),
      messagesRef: messages,
    }
  }

  function closeTitlePrompt() {
    titlePrompt.value = { open: false, mode: null, title: '', messagesRef: null }
  }

  function setTitlePromptTitle(title) {
    titlePrompt.value = { ...titlePrompt.value, title }
  }

  async function confirmTitlePrompt() {
    const { open, mode, title, messagesRef } = titlePrompt.value
    if (!open || !messagesRef) return
    const trimmed = (title || '').trim()
    if (!trimmed) return

    closeTitlePrompt()

    if (mode === 'save') {
      await runTitleAction({
        messages: messagesRef,
        title: trimmed,
        loadingRef: savingChat,
        run: (t, msgs) => saveLocalChat(t, msgs),
        onSuccess: () =>
          '✅ 已保存到本地浏览器（IndexedDB）。\n\n> 数据只在你当前浏览器里，换电脑 / 隐身模式看不到。点 ☁️ 可上传一份到云端备份/分享。',
        failPrefix: '⚠️ 保存失败：',
      })
    } else if (mode === 'upload') {
      await runTitleAction({
        messages: messagesRef,
        title: trimmed,
        loadingRef: uploadingChat,
        run: (t, msgs) => saveChatToGitHub(t, msgs),
        onSuccess: (result, t) =>
          `☁️ 已上传到云端备份：\n\n📎 [${t}](${result.url})\n🎫 Issue #${result.number}`,
        failPrefix: '⚠️ 上传失败：',
      })
    }
  }

  function save(messages) {
    openTitlePrompt('save', messages)
  }

  function upload(messages) {
    openTitlePrompt('upload', messages)
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
      pushBotMessage(messages, '⚠️ 等 AI 回复完再恢复历史。')
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
