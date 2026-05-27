<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal title-prompt-modal">
      <div class="modal-header">
        <h3>{{ mode === 'upload' ? '☁️ 上传到云端' : '💾 保存到本地' }}</h3>
        <button class="modal-close" type="button" @click="$emit('close')">✕</button>
      </div>
      <div class="modal-body">
        <label class="title-prompt-label">
          {{ mode === 'upload' ? '云端备份标题（公开 GitHub Issue）' : '对话标题（存到本浏览器）' }}
        </label>
        <input
          ref="inputRef"
          :value="title"
          class="title-prompt-input"
          type="text"
          maxlength="120"
          :disabled="busy"
          @input="$emit('update:title', $event.target.value)"
          @keydown.enter.prevent="$emit('confirm')"
          @keydown.esc.prevent="$emit('close')"
        />
        <p v-if="mode === 'upload'" class="modal-hint">
          上传后可在 GitHub Issues 查看；内容为公开备份，勿含密钥。
        </p>
      </div>
      <div class="modal-footer title-prompt-footer">
        <button type="button" class="modal-btn secondary" :disabled="busy" @click="$emit('close')">
          取消
        </button>
        <button
          type="button"
          class="modal-btn primary"
          :disabled="busy || !title.trim()"
          @click="$emit('confirm')"
        >
          {{ busy ? '处理中…' : mode === 'upload' ? '上传' : '保存' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'

const props = defineProps({
  mode: { type: String, required: true },
  title: { type: String, default: '' },
  busy: { type: Boolean, default: false },
})
defineEmits(['close', 'confirm', 'update:title'])

const inputRef = ref(null)
watch(
  () => props.title,
  async () => {
    await nextTick()
    inputRef.value?.focus()
    inputRef.value?.select()
  },
  { immediate: true },
)
</script>
