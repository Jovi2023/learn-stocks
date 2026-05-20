<template>
  <div class="panel">
    <h3>📈 数据查询</h3>
    <div class="form-group">
      <label>市场</label>
      <div class="toggle-group">
        <button :class="['toggle-btn', { active: form.market === 'us' }]" @click="form.market = 'us'">🇺🇸 美股</button>
        <button :class="['toggle-btn', { active: form.market === 'cn' }]" @click="form.market = 'cn'">🇨🇳 A股</button>
      </div>
    </div>
    <div class="form-group">
      <label>股票代码</label>
      <input v-model="form.symbol" :placeholder="form.market === 'us' ? '如 AAPL' : '如 600519'" />
      <div class="quick-btns">
        <button
          v-for="s in quickSymbols(form.market)"
          :key="s"
          class="chip-btn"
          @click="pickSymbol(s)"
        >
          {{ s }}
        </button>
      </div>
    </div>
    <div class="form-group">
      <label>数据类型</label>
      <select v-model="form.type">
        <option value="price">历史行情数据</option>
        <option value="financial">财务数据</option>
        <option value="options">期权链数据</option>
        <option value="info">股票基本信息</option>
      </select>
    </div>
    <div v-if="form.type === 'price'" class="form-group">
      <label>时间范围（年）</label>
      <select v-model="form.period">
        <option value="1y">1年</option>
        <option value="5y">5年</option>
        <option value="10y">10年</option>
        <option value="max">全部</option>
      </select>
    </div>
    <button class="action-btn" :disabled="loading" @click="run">🔍 查询</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { detectMarket, quickSymbols } from '../../composables/useMarketDetect.js'

defineProps({ loading: { type: Boolean, default: false } })
const emit = defineEmits(['run'])

const form = ref({ market: 'us', symbol: 'AAPL', type: 'price', period: '5y' })

const TYPE_LABELS = {
  price: '历史行情',
  financial: '财务数据',
  options: '期权链',
  info: '股票信息',
}

function pickSymbol(s) {
  form.value.symbol = s
  form.value.market = detectMarket(s)
}

function run() {
  const f = form.value
  const marketLabel = f.market === 'cn' ? '🇨🇳 A股' : '🇺🇸 美股'
  const typeLabel = TYPE_LABELS[f.type] || f.type
  const periodTag = f.type === 'price' ? `（${f.period}）` : ''
  emit('run', `${marketLabel} 查询 **${f.symbol}** 的${typeLabel}${periodTag}\n把查到的数据整理成表格展示。`)
}
</script>
