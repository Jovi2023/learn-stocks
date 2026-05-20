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
        :title="tab.label"
        :aria-label="tab.label"
        @click="$emit('switch-tab', tab.id)"
      >
        <span class="btn-icon">{{ tab.icon }}</span>
        <span class="btn-label">{{ tab.label }}</span>
      </button>
      <button
        class="save-btn"
        :disabled="savingChat"
        title="保存对话到本地浏览器"
        aria-label="保存对话到本地"
        @click="$emit('save')"
      >
        <span class="btn-icon">{{ savingChat ? '⏳' : '💾' }}</span>
        <span class="btn-label">保存</span>
      </button>
      <button
        class="upload-btn"
        :disabled="uploadingChat"
        title="上传当前对话到云端备份（公开 GitHub Issue）"
        aria-label="上传对话到云端"
        @click="$emit('upload')"
      >
        <span class="btn-icon">{{ uploadingChat ? '⏳' : '☁️' }}</span>
        <span class="btn-label">上传</span>
      </button>
      <button
        class="history-btn"
        title="本地历史对话"
        aria-label="本地历史对话"
        @click="$emit('history')"
      >
        <span class="btn-icon">📋</span>
        <span class="btn-label">历史</span>
      </button>
    </div>
  </header>
</template>

<script setup>
defineProps({
  tabs: { type: Array, required: true },
  activeTab: { type: String, required: true },
  savingChat: { type: Boolean, default: false },
  uploadingChat: { type: Boolean, default: false },
})
defineEmits(['switch-tab', 'save', 'upload', 'history'])
</script>
