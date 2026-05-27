#!/usr/bin/env node
/**
 * 将 kaiSystemPrompt.js 生成的协议写入 ~/.openclaw/workspace/MEMORY.md
 * 用法：node scripts/sync-openclaw-prompt.mjs
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { KAI_QUANT_CONSOLE_SYSTEM_PROMPT } from '../src/utils/kaiSystemPrompt.js'

const memoryPath = path.join(os.homedir(), '.openclaw', 'workspace', 'MEMORY.md')
const markerStart = '## quant-console 回复协议（Kai）'
const markerEnd = '<!-- end quant-console kai protocol -->'

const block = `${KAI_QUANT_CONSOLE_SYSTEM_PROMPT}\n${markerEnd}`

let content = fs.existsSync(memoryPath) ? fs.readFileSync(memoryPath, 'utf8') : '# MEMORY.md - Long Term Memory\n\n'

const re = new RegExp(
  `${markerStart}[\\s\\S]*?${markerEnd.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
  'm',
)
if (re.test(content)) {
  content = content.replace(re, block)
} else {
  content = content.trimEnd() + '\n\n' + block + '\n'
}

fs.writeFileSync(memoryPath, content.endsWith('\n') ? content : content + '\n')
console.log('Updated:', memoryPath)
