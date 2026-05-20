<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-header">
        <h3>📋 历史对话</h3>
        <button class="modal-close" @click="$emit('close')">✕</button>
      </div>
      <div class="modal-body">
        <div v-if="loading" class="modal-loading">加载中...</div>
        <div v-else-if="items.length === 0" class="modal-empty">
          暂无历史对话。
          <p class="modal-hint">
            在聊天框中发送消息后，点击 💾 保存 可将对话保存到 GitHub Issues。
          </p>
        </div>
        <div v-else class="history-list">
          <div
            v-for="item in items"
            :key="item.number"
            class="history-item"
            @click="openIssue(item.html_url)"
          >
            <div class="history-title">{{ item.title.replace('💬 ', '') }}</div>
            <div class="history-meta">
              <span>#{{ item.number }}</span>
              <span>{{ new Date(item.created_at).toLocaleDateString('zh-CN') }}</span>
              <span>{{ item.comments }} 条回复</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  loading: { type: Boolean, default: false },
  items: { type: Array, default: () => [] },
})
defineEmits(['close'])

function openIssue(url) {
  window.open(url, '_blank', 'noopener,noreferrer')
}
</script>
