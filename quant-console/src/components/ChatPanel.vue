<template>
  <div class="chat-panel">
    <div ref="messagesRef" class="messages">
      <div v-for="(msg, i) in messages" :key="i" :class="['msg', msg.role]">
        <div class="msg-avatar">{{ msg.role === 'user' ? '👤' : '🜁' }}</div>
        <div class="msg-content">
          <div class="msg-name">{{ msg.role === 'user' ? '你' : '凯' }}</div>
          <div class="msg-body" v-html="renderMarkdown(msg.content)"></div>
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
        placeholder="描述你的量化需求… 比如：回测AAPL双均线策略"
        rows="2"
        @keydown.enter.exact="onEnter"
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
import { renderMarkdown } from '../utils/markdown.js'

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

function onEnter(e) {
  // 中文输入法选词期间按 Enter 是「确认候选词」，不该当作发送
  if (e && e.isComposing) return
  if (e) e.preventDefault()
  // loading 时禁用 Enter 触发：避免误触把当前请求停掉
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
