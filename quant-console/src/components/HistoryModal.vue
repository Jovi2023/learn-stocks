<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-header">
        <h3>📋 本地历史对话</h3>
        <button class="modal-close" @click="$emit('close')">✕</button>
      </div>
      <div class="modal-body">
        <div v-if="loading" class="modal-loading">加载中...</div>
        <div v-else-if="items.length === 0" class="modal-empty">
          暂无本地历史。
          <p class="modal-hint">
            发送消息后点 💾 保存，会把对话存到这个浏览器（IndexedDB）。
            想跨设备 / 分享给别人，点 ☁️ 上传一份到 GitHub。
          </p>
        </div>
        <div v-else class="history-list">
          <div v-for="item in items" :key="item.id" class="history-item">
            <div class="history-info">
              <div class="history-title">{{ item.title }}</div>
              <div class="history-meta">
                <span>{{ formatDate(item.created) }}</span>
                <span>{{ item.messages.length }} 条消息</span>
              </div>
            </div>
            <button
              class="history-del"
              title="删除这条本地存档"
              aria-label="删除"
              @click="confirmDelete(item)"
            >🗑</button>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <span class="modal-footer-hint">
          📌 数据存在本地浏览器（IndexedDB），换浏览器 / 隐身模式 / 清缓存都会丢
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  loading: { type: Boolean, default: false },
  items: { type: Array, default: () => [] },
})
const emit = defineEmits(['close', 'delete'])

function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleString('zh-CN', { hour12: false })
}

function confirmDelete(item) {
  if (confirm(`确定删除「${item.title}」？`)) emit('delete', item.id)
}
</script>
