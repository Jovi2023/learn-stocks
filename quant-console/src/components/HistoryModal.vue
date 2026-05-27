<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-header">
        <h3>📋 对话存档</h3>
        <button class="modal-close" @click="$emit('close')">✕</button>
      </div>
      <div class="modal-body">
        <button type="button" class="history-open-file-btn" @click="$emit('open-file')">
          📂 从硬盘打开 .json 存档
        </button>
        <p class="modal-hint history-open-hint">
          💾 保存会写入你电脑上的 JSON 文件（Chrome 可选路径，其他浏览器默认进「下载」）。
        </p>

        <template v-if="loading">
          <div class="modal-loading">检查旧版浏览器内存档…</div>
        </template>
        <template v-else-if="items.length > 0">
          <p class="history-legacy-label">旧版浏览器内存档（IndexedDB，建议改用硬盘文件）：</p>
          <div class="history-list">
            <div v-for="item in items" :key="item.id" class="history-item">
              <div
                class="history-info"
                role="button"
                tabindex="0"
                :title="`恢复「${item.title}」`"
                @click="emit('restore', item.id)"
                @keydown.enter="emit('restore', item.id)"
              >
                <div class="history-title">{{ item.title }}</div>
                <div class="history-meta">
                  <span>{{ formatDate(item.created) }}</span>
                  <span>{{ item.messages.length }} 条消息</span>
                </div>
              </div>
              <button
                class="history-del"
                title="删除这条浏览器内存档"
                aria-label="删除"
                @click="confirmDelete(item)"
              >🗑</button>
            </div>
          </div>
        </template>
      </div>
      <div class="modal-footer">
        <span class="modal-footer-hint">
          跨设备请用 ☁️ 上传；日常备份用 💾 保存到硬盘 JSON 即可。
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
const emit = defineEmits(['close', 'delete', 'restore', 'open-file'])

function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleString('zh-CN', { hour12: false })
}

function confirmDelete(item) {
  if (confirm(`确定删除浏览器内的「${item.title}」？（硬盘上的文件不受影响）`)) {
    emit('delete', item.id)
  }
}
</script>

<style scoped>
.history-open-file-btn {
  width: 100%;
  padding: 12px 16px;
  margin-bottom: 10px;
  border: 1px solid #3b82f6;
  border-radius: 8px;
  background: rgba(59, 130, 246, 0.15);
  color: #93c5fd;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.15s;
}
.history-open-file-btn:hover {
  background: rgba(59, 130, 246, 0.28);
  color: #e2e8f0;
}
.history-open-hint {
  margin-bottom: 16px;
}
.history-legacy-label {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 8px;
}
</style>
