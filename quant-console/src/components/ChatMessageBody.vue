<template>
  <div class="msg-body">
    <template v-for="(part, j) in parts" :key="j">
      <div v-if="part.type === 'md'" v-html="renderMarkdown(part.text)"></div>
      <KaiChart v-else :spec="part.spec" />
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { splitMessageParts } from '../utils/messageParts.js'
import { renderMarkdown } from '../utils/markdown.js'
import KaiChart from './KaiChart.vue'

const props = defineProps({
  content: { type: String, default: '' },
})

const parts = computed(() => splitMessageParts(props.content))
</script>
