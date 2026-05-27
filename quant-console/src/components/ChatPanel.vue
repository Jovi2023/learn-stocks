<template>
  <div class="chat-panel">
    <div ref="messagesRef" class="messages" @click="handleMessagesClick">
      <div v-for="(msg, i) in messages" :key="i" :class="['msg', msg.role]">
        <div class="msg-avatar">{{ msg.role === 'user' ? '👤' : '🜁' }}</div>
        <div class="msg-content">
          <div class="msg-name">{{ msg.role === 'user' ? '你' : '凯' }}</div>
          <ChatMessageBody :content="msg.content" />
        </div>
      </div>
      <div v-if="loading" class="msg bot">
        <div class="msg-avatar">🜁</div>
        <div class="msg-content">
          <div class="msg-name">凯</div>
          <div class="msg-body thinking">
            <span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>
          </div>
        </div>
      </div>
    </div>
    <div class="input-area">
      <textarea
        v-model="inputText"
        placeholder="描述需求… Ctrl+Enter 发送，Alt+1~4 切换面板"
        rows="2"
        @keydown="onKeydown"
      ></textarea>
      <button
        class="send-btn"
        :class="{ stop: loading }"
        :disabled="!loading && !inputText.trim()"
        @click="onClick"
      >
        {{ loading ? '⏹ 停止' : '发送' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, watch } from 'vue'
import ChatMessageBody from './ChatMessageBody.vue'
import { useCodeCopy } from '../composables/useCodeCopy.js'
import { usePyodideRun } from '../composables/usePyodideRun.js'

const { handleMessagesClick: handleCopyClick } = useCodeCopy()
const { handleRunClick } = usePyodideRun()

function handleMessagesClick(e) {
  if (e.target.closest?.('.code-run-btn')) {
    handleRunClick(e)
    return
  }
  handleCopyClick(e)
}

const props = defineProps({
  messages: { type: Array, required: true },
  loading: { type: Boolean, default: false },
})
const emit = defineEmits(['send', 'cancel'])

const inputText = ref('')
const messagesRef = ref(null)

// 消息变多或开始/结束 loading 时滚到底
watch(
  [() => props.messages.length, () => props.loading],
  () => {
    nextTick(() => {
      if (messagesRef.value) messagesRef.value.scrollTop = messagesRef.value.scrollHeight
    })
  },
)

function onKeydown(e) {
  if (e.isComposing) return
  const sendCombo = (e.ctrlKey || e.metaKey) && e.key === 'Enter'
  if (!sendCombo) return
  e.preventDefault()
  if (props.loading) return
  onSend()
}

function onClick() {
  if (props.loading) emit('cancel')
  else onSend()
}

function onSend() {
  const text = inputText.value.trim()
  if (!text || props.loading) return
  emit('send', text)
  inputText.value = ''
}
</script>
