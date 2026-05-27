<template>
  <div class="app">
    <AppHeader
      :tabs="tabs"
      :active-tab="activeTab"
      :saving-chat="savingChat"
      :uploading-chat="uploadingChat"
      @switch-tab="onSwitchTab"
      @save="save(messages)"
      @upload="upload(messages)"
      @history="loadHistory"
    />
    <div class="main">
      <ChatPanel :messages="messages" :loading="loading" @send="send" @cancel="cancel" />
      <div
        v-if="drawerOpen"
        class="drawer-overlay"
        aria-hidden="true"
        @click="drawerOpen = false"
      ></div>
      <aside :class="['side-panel', { 'drawer-open': drawerOpen }]">
        <button
          class="drawer-close"
          aria-label="关闭工具面板"
          @click="drawerOpen = false"
        >✕</button>
        <BacktestPanel v-show="activeTab === 'backtest'" :loading="loading" @run="onPanelRun" />
        <CodePanel v-show="activeTab === 'code'" :loading="loading" @run="onPanelRun" />
        <DataPanel v-show="activeTab === 'data'" :loading="loading" @run="onPanelRun" />
        <AnalyzePanel v-show="activeTab === 'analyze'" :loading="loading" @run="onPanelRun" />
        <FactorPanel v-show="activeTab === 'factor'" :loading="loading" @run="onPanelRun" />
      </aside>
    </div>
    <HistoryModal
      v-if="showHistory"
      :loading="loadingHistory"
      :items="historyList"
      @close="closeHistory"
      @delete="removeFromHistory"
      @restore="onRestoreHistory"
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
import FactorPanel from './components/panels/FactorPanel.vue'
import { useChat } from './composables/useChat.js'
import { useChatStorage } from './composables/useChatStorage.js'
import { useKeyboardShortcuts } from './composables/useKeyboardShortcuts.js'

const activeTab = ref('backtest')
const drawerOpen = ref(false)
const tabs = [
  { id: 'backtest', icon: '📊', label: '回测' },
  { id: 'code', icon: '💻', label: '写代码' },
  { id: 'data', icon: '📈', label: '查数据' },
  { id: 'analyze', icon: '🧠', label: '分析' },
  { id: 'factor', icon: '🧬', label: '因子' },
]

const { messages, loading, send, cancel, restore } = useChat()
const {
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
} = useChatStorage()

function onSwitchTab(id) {
  activeTab.value = id
  drawerOpen.value = true
}

useKeyboardShortcuts({
  onSwitchTab,
  onEscape: () => (showHistory.value ? closeHistory() : (drawerOpen.value = false)),
  isOverlayOpen: () => showHistory.value,
})

function onPanelRun(prompt) {
  send(prompt)
  drawerOpen.value = false
}

function onRestoreHistory(id) {
  restoreFromHistory(id, { messages, restore, loading })
}
</script>
