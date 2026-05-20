<template>
  <header class="header">
    <div class="header-left">
      <span class="logo">🜁</span>
      <h1>凯的量化控制台</h1>
    </div>
    <div class="header-right">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :class="['tab-btn', { active: activeTab === tab.id }]"
        @click="$emit('switch-tab', tab.id)"
      >
        {{ tab.icon }} {{ tab.label }}
      </button>
      <button class="save-btn" :disabled="savingChat" title="保存对话到 GitHub" @click="$emit('save')">
        {{ savingChat ? '⏳' : '💾' }} 保存
      </button>
      <button class="history-btn" title="历史对话" @click="$emit('history')">📋 历史</button>
    </div>
  </header>
</template>

<script setup>
defineProps({
  tabs: { type: Array, required: true },
  activeTab: { type: String, required: true },
  savingChat: { type: Boolean, default: false },
})
defineEmits(['switch-tab', 'save', 'history'])
</script>
