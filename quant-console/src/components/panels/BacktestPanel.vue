<template>
  <div class="panel">
    <h3>📊 策略回测</h3>
    <div class="form-group">
      <label>市场</label>
      <div class="toggle-group">
        <button :class="['toggle-btn', { active: form.market === 'us' }]" @click="form.market = 'us'">🇺🇸 美股</button>
        <button :class="['toggle-btn', { active: form.market === 'cn' }]" @click="form.market = 'cn'">🇨🇳 A股</button>
      </div>
    </div>
    <div class="form-group">
      <label>标的代码</label>
      <input
        v-model="form.symbol"
        :placeholder="form.market === 'us' ? '如 AAPL / SPY / TSLA' : '如 600519 / 000858 / 300750'"
      />
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
      <label>策略</label>
      <select v-model="form.strategy">
        <option value="ma_cross">双均线交叉</option>
        <option value="rsi">RSI 均值回归</option>
        <option value="bollinger">布林带突破</option>
        <option value="macd">MACD 策略</option>
        <option value="momentum">动量策略</option>
      </select>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>起始</label>
        <input v-model="form.startDate" type="date" />
      </div>
      <div class="form-group">
        <label>结束</label>
        <input v-model="form.endDate" type="date" />
      </div>
    </div>
    <div class="form-group">
      <label>对比基准</label>
      <input
        v-model="form.benchmark"
        :placeholder="form.market === 'us' ? '如 SPY（可选）' : '如 沪深300（可选）'"
      />
    </div>
    <button class="action-btn" :disabled="loading" @click="run">🚀 跑回测</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { detectMarket, quickSymbols } from '../../composables/useMarketDetect.js'

defineProps({ loading: { type: Boolean, default: false } })
const emit = defineEmits(['run'])

const form = ref({
  market: 'us',
  symbol: 'AAPL',
  strategy: 'ma_cross',
  startDate: '2020-01-01',
  endDate: '2025-12-31',
  benchmark: 'SPY',
})

const STRATEGY_LABELS = {
  ma_cross: '双均线交叉',
  rsi: 'RSI均值回归',
  bollinger: '布林带突破',
  macd: 'MACD策略',
  momentum: '动量策略',
}

function pickSymbol(s) {
  form.value.symbol = s
  form.value.market = detectMarket(s)
}

function run() {
  const f = form.value
  const marketLabel = f.market === 'cn' ? '🇨🇳 A股' : '🇺🇸 美股'
  const strategyLabel = STRATEGY_LABELS[f.strategy] || f.strategy
  const prompt =
    `${marketLabel} 回测 **${f.symbol}** 的 **${strategyLabel}** 策略\n\n` +
    `周期：${f.startDate} 至 ${f.endDate}\n` +
    `对比基准：${f.benchmark || '无'}\n` +
    `请给出详细的回测结果报告，包含绩效指标表、资金曲线分析和优化建议。`
  emit('run', prompt)
}
</script>
