<template>
  <div class="app">
    <AppHeader
      :tabs="tabs"
      :active-tab="activeTab"
      :saving-chat="savingChat"
      @switch-tab="activeTab = $event"
      @save="onSave"
      @history="loadHistory"
    />
    <div class="main">
      <ChatPanel :messages="messages" :loading="loading" @send="send" @cancel="cancel" />
      <div class="side-panel">
        <BacktestPanel v-show="activeTab === 'backtest'" :loading="loading" @run="send" />
        <CodePanel v-show="activeTab === 'code'" :loading="loading" @run="send" />
        <DataPanel v-show="activeTab === 'data'" :loading="loading" @run="send" />
        <AnalyzePanel v-show="activeTab === 'analyze'" :loading="loading" @run="send" />
      </div>
    </div>
    <HistoryModal
      v-if="showHistory"
      :loading="loadingHistory"
      :items="historyList"
      @close="closeHistory"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import AppHeader from './components/AppHeader.vue'
import ChatPanel from './components/ChatPanel.vue'
import HistoryModal from './components/HistoryModal.vue'
import BacktestPanel from './components/panels/BacktestPanel.vue'
import CodePanel from './components/panels/CodePanel.vue'
import DataPanel from './components/panels/DataPanel.vue'
import AnalyzePanel from './components/panels/AnalyzePanel.vue'
import { useChat } from './composables/useChat.js'
import { useChatStorage } from './composables/useChatStorage.js'

const activeTab = ref('backtest')
const tabs = [
  { id: 'backtest', icon: '📊', label: '回测' },
  { id: 'code', icon: '💻', label: '写代码' },
  { id: 'data', icon: '📈', label: '查数据' },
  { id: 'analyze', icon: '🧠', label: '分析' },
]

const { messages, loading, send, cancel } = useChat()
const {
  savingChat,
  showHistory,
  historyList,
  loadingHistory,
  saveChat,
  loadHistory,
  closeHistory,
} = useChatStorage()

async function onSave() {
  const msgs = messages.value.filter((m) => m.role !== 'system')
  if (msgs.length <= 1) {
    messages.value.push({ role: 'bot', content: '⚠️ 还没有可保存的对话内容。' })
    return
  }
  const title = prompt('给这段对话起个标题：', '量化分析 ' + new Date().toLocaleDateString('zh-CN'))
  if (!title) return
  try {
    const result = await saveChat(title, msgs)
    messages.value.push({
      role: 'bot',
      content: `✅ 对话已保存！\n\n📎 [${title}](${result.url})\n🎫 Issue #${result.number}`,
    })
  } catch (err) {
    messages.value.push({ role: 'bot', content: '⚠️ 保存失败：' + err.message })
  }
}
</script>
