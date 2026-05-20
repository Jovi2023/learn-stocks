<template>
  <div class="panel">
    <h3>💻 代码生成</h3>
    <div class="form-group">
      <label>市场</label>
      <div class="toggle-group">
        <button :class="['toggle-btn', { active: form.market === 'us' }]" @click="form.market = 'us'">🇺🇸 美股</button>
        <button :class="['toggle-btn', { active: form.market === 'cn' }]" @click="form.market = 'cn'">🇨🇳 A股</button>
      </div>
    </div>
    <div class="form-group">
      <label>要写什么？</label>
      <textarea
        v-model="form.prompt"
        :placeholder="form.market === 'us' ? '如：获取TSLA的5年日线数据并画K线图' : '如：获取贵州茅台的5年日线数据'"
        rows="4"
      ></textarea>
    </div>
    <div class="form-group">
      <label>语言</label>
      <select v-model="form.lang">
        <option value="python">Python</option>
        <option value="javascript">JavaScript</option>
      </select>
    </div>
    <button class="action-btn" :disabled="loading" @click="run">✨ 生成代码</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({ loading: { type: Boolean, default: false } })
const emit = defineEmits(['run'])

const form = ref({ market: 'us', prompt: '', lang: 'python' })

function run() {
  const f = form.value
  if (!f.prompt.trim()) return
  const langLabel = f.lang === 'python' ? 'Python' : 'JavaScript'
  emit('run', `用 **${langLabel}** 写代码：${f.prompt}\n请给出完整可运行的代码，附带注释说明。`)
}
</script>
