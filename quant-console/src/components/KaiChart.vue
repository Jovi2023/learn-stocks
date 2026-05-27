<template>
  <div class="kai-chart">
    <div v-if="spec.title" class="kai-chart-title">{{ spec.title }}</div>
    <div class="kai-chart-canvas-wrap">
      <canvas ref="canvasRef"></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import {
  Chart,
  LineController,
  BarController,
  LineElement,
  BarElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Legend,
  Tooltip,
} from 'chart.js'

Chart.register(
  LineController,
  BarController,
  LineElement,
  BarElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Legend,
  Tooltip,
)

const PALETTE = ['#3b82f6', '#8b5cf6', '#facc15', '#4ade80', '#f472b6', '#38bdf8', '#fb923c', '#a78bfa']

const props = defineProps({
  spec: { type: Object, required: true },
})

const canvasRef = ref(null)
let chart = null

function hexAlpha(hex, a) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${a})`
}

function buildConfig(spec) {
  const isLine = spec.type === 'line'
  return {
    type: spec.type,
    data: {
      labels: spec.labels,
      datasets: spec.datasets.map((ds, i) => {
        const color = ds.color || PALETTE[i % PALETTE.length]
        return {
          label: ds.label,
          data: ds.data,
          borderColor: color,
          backgroundColor: isLine ? hexAlpha(color, 0.15) : hexAlpha(color, 0.55),
          borderWidth: 2,
          tension: isLine ? 0.25 : 0,
          fill: isLine,
        }
      }),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#94a3b8', boxWidth: 12 } },
      },
      scales: {
        x: { ticks: { color: '#64748b' }, grid: { color: '#334155' } },
        y: { ticks: { color: '#64748b' }, grid: { color: '#334155' } },
      },
    },
  }
}

function renderChart() {
  if (!canvasRef.value) return
  chart?.destroy()
  chart = new Chart(canvasRef.value, buildConfig(props.spec))
}

onMounted(renderChart)
watch(() => props.spec, renderChart, { deep: true })
onUnmounted(() => {
  chart?.destroy()
  chart = null
})
</script>
