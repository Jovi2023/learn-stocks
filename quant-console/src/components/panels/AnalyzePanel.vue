<template>
  <div class="panel">
    <h3>🧠 策略分析</h3>
    <div class="form-group">
      <label>描述或粘贴你的策略</label>
      <textarea
        v-model="form.description"
        placeholder="描述你的策略逻辑，或粘贴策略代码…"
        rows="6"
      ></textarea>
    </div>
    <button class="action-btn" :disabled="loading" @click="run">🔬 分析策略</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({ loading: { type: Boolean, default: false } })
const emit = defineEmits(['run'])

const form = ref({ description: '' })

function run() {
  const f = form.value
  if (!f.description.trim()) return
  emit('run', `帮我分析这个量化策略的优缺点、风险点和优化建议：\n${f.description}`)
}
</script>
