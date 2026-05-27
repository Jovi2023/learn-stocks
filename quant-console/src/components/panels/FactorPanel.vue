<template>
  <div class="panel factor-panel">
    <h3>🧬 因子工程</h3>
    <p class="factor-hint">Kai 将先输出 Python，再按固定 schema 生成 3 张图（IC / 分层 / 统计）</p>

    <div class="form-group">
      <label>市场</label>
      <select v-model="form.market">
        <option value="us">🇺🇸 美股</option>
        <option value="cn">🇨🇳 A股</option>
      </select>
    </div>

    <div class="form-group">
      <label>股票池</label>
      <textarea
        v-model="form.symbols"
        placeholder="输入代码，换行分隔。示例：&#10;AAPL&#10;MSFT&#10;GOOGL&#10;...或留空由 AI 自动选取"
        rows="3"
      ></textarea>
    </div>

    <div class="factor-config">
      <div class="form-group">
        <label>因子类型</label>
        <select v-model="form.factorType">
          <option value="momentum">🚀 动量因子 — 过去N日收益率</option>
          <option value="reversal">🔄 反转因子 — 短期反转效应</option>
          <option value="volatility">📉 波动率因子 — 低波/高波偏好</option>
          <option value="volume">📊 成交量因子 — 量价关系</option>
          <option value="quality">🏆 质量因子 — ROE/毛利率综合</option>
          <option value="size">📏 规模因子 — 市值因子</option>
          <option value="combo">🧩 复合因子 — 多因子加权合成</option>
        </select>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>回溯窗口 (天)</label>
          <input v-model.number="form.lookback" type="number" min="5" max="500" />
        </div>
        <div class="form-group">
          <label>持有期 (天)</label>
          <input v-model.number="form.holdPeriod" type="number" min="1" max="120" />
        </div>
        <div class="form-group">
          <label>分层组数</label>
          <input v-model.number="form.quantiles" type="number" min="3" max="10" />
        </div>
      </div>

      <fieldset v-if="form.factorType === 'combo'" class="combo-weights">
        <legend>子因子权重 (0-1，总和自动归一化)</legend>
        <div class="weight-row">
          <label>动量 <input v-model.number="form.weights.momentum" type="number" min="0" max="1" step="0.1" /></label>
          <label>反转 <input v-model.number="form.weights.reversal" type="number" min="0" max="1" step="0.1" /></label>
          <label>波动率 <input v-model.number="form.weights.volatility" type="number" min="0" max="1" step="0.1" /></label>
        </div>
        <div class="weight-row">
          <label>成交量 <input v-model.number="form.weights.volume" type="number" min="0" max="1" step="0.1" /></label>
          <label>质量 <input v-model.number="form.weights.quality" type="number" min="0" max="1" step="0.1" /></label>
          <label>规模 <input v-model.number="form.weights.size" type="number" min="0" max="1" step="0.1" /></label>
        </div>
      </fieldset>
    </div>

    <div class="form-group">
      <label>回测区间 (YYYY-MM-DD)</label>
      <div class="form-row">
        <input v-model="form.dateFrom" type="text" placeholder="起始日期 (如 2023-01-01)" />
        <input v-model="form.dateTo" type="text" placeholder="截止日期 (如 2025-12-31)" />
      </div>
    </div>

    <button class="action-btn" :disabled="loading" @click="run">🧬 运行因子分析</button>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { buildFactorPrompt } from '../../utils/factorPrompt.js'

defineProps({ loading: { type: Boolean, default: false } })
const emit = defineEmits(['run'])

const form = reactive({
  market: 'us',
  symbols: '',
  factorType: 'momentum',
  lookback: 60,
  holdPeriod: 20,
  quantiles: 5,
  dateFrom: '2023-01-01',
  dateTo: '2025-06-30',
  weights: {
    momentum: 0.3,
    reversal: 0.2,
    volatility: 0.15,
    volume: 0.15,
    quality: 0.1,
    size: 0.1,
  },
})

function run() {
  emit('run', buildFactorPrompt(form))
}
</script>

<style scoped>
.factor-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.factor-hint {
  margin: 0;
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.4;
}

.factor-config {
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 12px;
  background: rgba(30, 41, 59, 0.4);
}

.form-row {
  display: flex;
  gap: 8px;
}

.form-row > * {
  flex: 1;
  min-width: 0;
}

.combo-weights {
  border: 1px dashed #475569;
  border-radius: 6px;
  padding: 8px;
  margin-top: 8px;
}

.combo-weights legend {
  color: #94a3b8;
  font-size: 12px;
}

.weight-row {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
}

.weight-row label {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #cbd5e1;
}

.weight-row input {
  width: 56px;
  padding: 3px 6px;
  background: #1e293b;
  border: 1px solid #475569;
  border-radius: 4px;
  color: #e2e8f0;
  font-size: 12px;
  text-align: center;
}
</style>
