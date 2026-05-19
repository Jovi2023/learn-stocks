<template>
  <div class="app">
    <header class="header">
      <div class="header-left">
        <span class="logo">🜁</span>
        <h1>凯的量化控制台</h1>
      </div>
      <div class="header-right">
        <button v-for="tab in tabs" :key="tab.id" :class="['tab-btn', { active: activeTab === tab.id }]" @click="activeTab = tab.id">
          {{ tab.icon }} {{ tab.label }}
        </button>
        <button class="save-btn" @click="saveChat" :disabled="savingChat" title="保存对话到 GitHub">
          {{ savingChat ? '⏳' : '💾' }} 保存
        </button>
        <button class="history-btn" @click="showHistory = !showHistory" title="历史对话">
          📋 历史
        </button>
      </div>
    </header>
    <div class="main">
      <div class="chat-panel">
        <div class="messages" ref="messagesRef">
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
              <div class="msg-body thinking"><span class="dot">.</span><span class="dot">.</span><span class="dot">.</span></div>
            </div>
          </div>
        </div>
        <div class="input-area">
          <textarea v-model="inputText" placeholder="描述你的量化需求… 比如：回测AAPL双均线策略" @keydown.enter.exact="sendMessage" rows="2"></textarea>
          <button class="send-btn" @click="sendMessage" :disabled="loading || !inputText.trim()">{{ loading ? '⏳' : '发送' }}</button>
        </div>
      </div>
      <div class="side-panel">
        <div v-show="activeTab === 'backtest'" class="panel">
          <h3>📊 策略回测</h3>
          <div class="form-group">
            <label>市场</label>
            <div class="toggle-group">
              <button :class="['toggle-btn', { active: backtestForm.market === 'us' }]" @click="backtestForm.market = 'us'">🇺🇸 美股</button>
              <button :class="['toggle-btn', { active: backtestForm.market === 'cn' }]" @click="backtestForm.market = 'cn'">🇨🇳 A股</button>
            </div>
          </div>
          <div class="form-group">
            <label>标的代码</label>
            <input v-model="backtestForm.symbol" :placeholder="backtestForm.market === 'us' ? '如 AAPL / SPY / TSLA' : '如 600519 / 000858 / 300750'" />
            <div class="quick-btns">
              <button v-for="s in quickSymbols" :key="s" class="chip-btn" @click="backtestForm.symbol = s; syncMarketFromSymbol()">{{ s }}</button>
            </div>
          </div>
          <div class="form-group">
            <label>策略</label>
            <select v-model="backtestForm.strategy">
              <option value="ma_cross">双均线交叉</option>
              <option value="rsi">RSI 均值回归</option>
              <option value="bollinger">布林带突破</option>
              <option value="macd">MACD 策略</option>
              <option value="momentum">动量策略</option>
            </select>
          </div>
          <div class="form-row">
            <div class="form-group"><label>起始</label><input type="date" v-model="backtestForm.startDate" /></div>
            <div class="form-group"><label>结束</label><input type="date" v-model="backtestForm.endDate" /></div>
          </div>
          <div class="form-group"><label>对比基准</label><input v-model="backtestForm.benchmark" :placeholder="backtestForm.market === 'us' ? '如 SPY（可选）' : '如 沪深300（可选）'" /></div>
          <button class="action-btn" @click="runBacktest" :disabled="loading">🚀 跑回测</button>
        </div>
        <div v-show="activeTab === 'code'" class="panel">
          <h3>💻 代码生成</h3>
          <div class="form-group">
            <label>市场</label>
            <div class="toggle-group">
              <button :class="['toggle-btn', { active: codeForm.market === 'us' }]" @click="codeForm.market = 'us'">🇺🇸 美股</button>
              <button :class="['toggle-btn', { active: codeForm.market === 'cn' }]" @click="codeForm.market = 'cn'">🇨🇳 A股</button>
            </div>
          </div>
          <div class="form-group"><label>要写什么？</label><textarea v-model="codeForm.prompt" :placeholder="codeForm.market === 'us' ? '如：获取TSLA的5年日线数据并画K线图' : '如：获取贵州茅台的5年日线数据'" rows="4"></textarea></div>
          <div class="form-group"><label>语言</label><select v-model="codeForm.lang"><option value="python">Python</option><option value="javascript">JavaScript</option></select></div>
          <button class="action-btn" @click="generateCode" :disabled="loading">✨ 生成代码</button>
        </div>
        <div v-show="activeTab === 'data'" class="panel">
          <h3>📈 数据查询</h3>
          <div class="form-group">
            <label>市场</label>
            <div class="toggle-group">
              <button :class="['toggle-btn', { active: dataForm.market === 'us' }]" @click="dataForm.market = 'us'">🇺🇸 美股</button>
              <button :class="['toggle-btn', { active: dataForm.market === 'cn' }]" @click="dataForm.market = 'cn'">🇨🇳 A股</button>
            </div>
          </div>
          <div class="form-group">
            <label>股票代码</label>
            <input v-model="dataForm.symbol" :placeholder="dataForm.market === 'us' ? '如 AAPL' : '如 600519'" />
            <div class="quick-btns">
              <button v-for="s in quickSymbols" :key="s" class="chip-btn" @click="dataForm.symbol = s; syncDataMarket()">{{ s }}</button>
            </div>
          </div>
          <div class="form-group">
            <label>数据类型</label>
            <select v-model="dataForm.type">
              <option value="price">历史行情数据</option>
              <option value="financial">财务数据</option>
              <option value="options">期权链数据</option>
              <option value="info">股票基本信息</option>
            </select>
          </div>
          <div class="form-group" v-if="dataForm.type === 'price'"><label>时间范围（年）</label><select v-model="dataForm.period"><option value="1y">1年</option><option value="5y">5年</option><option value="10y">10年</option><option value="max">全部</option></select></div>
          <button class="action-btn" @click="queryData" :disabled="loading">🔍 查询</button>
        </div>
        <div v-show="activeTab === 'analyze'" class="panel">
          <h3>🧠 策略分析</h3>
          <div class="form-group"><label>描述或粘贴你的策略</label><textarea v-model="analyzeForm.description" placeholder="描述你的策略逻辑，或粘贴策略代码…" rows="6"></textarea></div>
          <button class="action-btn" @click="analyzeStrategy" :disabled="loading">🔬 分析策略</button>
        </div>
      </div>
    </div>
    
    <!-- 历史对话弹窗 -->
    <div v-if="showHistory" class="modal-overlay" @click.self="showHistory = false">
      <div class="modal">
        <div class="modal-header">
          <h3>📋 历史对话</h3>
          <button class="modal-close" @click="showHistory = false">✕</button>
        </div>
        <div class="modal-body">
          <div v-if="loadingHistory" class="modal-loading">加载中...</div>
          <div v-else-if="historyList.length === 0" class="modal-empty">
            暂无历史对话。
            <p class="modal-hint">在聊天框中发送消息后，点击 💾 保存 可将对话保存到 GitHub Issues。</p>
          </div>
          <div v-else class="history-list">
            <div v-for="item in historyList" :key="item.number" class="history-item" @click="openIssue(item.html_url)">
              <div class="history-title">{{ item.title.replace('💬 ', '') }}</div>
              <div class="history-meta">
                <span>#{{ item.number }}</span>
                <span>{{ new Date(item.created_at).toLocaleDateString('zh-CN') }}</span>
                <span>{{ item.comments }} 条回复</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, computed, onMounted } from 'vue'
import { marked } from 'marked'
import { welcomeMsg } from './utils/responses.js'
import { callKai } from './utils/api.js'
import { saveChatToGitHub, loadChatHistory } from './utils/storage.js'

const activeTab = ref('backtest')
const inputText = ref('')
const messages = ref([{ role: 'bot', content: welcomeMsg }])
const loading = ref(false)
const savingChat = ref(false)
const showHistory = ref(false)
const historyList = ref([])
const loadingHistory = ref(false)
const messagesRef = ref(null)

const backtestForm = ref({ market: 'us', symbol: 'AAPL', strategy: 'ma_cross', startDate: '2020-01-01', endDate: '2025-12-31', benchmark: 'SPY' })
const codeForm = ref({ market: 'us', prompt: '', lang: 'python' })
const dataForm = ref({ market: 'us', symbol: 'AAPL', type: 'price', period: '5y' })
const analyzeForm = ref({ description: '' })

const tabs = [
  { id: 'backtest', icon: '📊', label: '回测' },
  { id: 'code', icon: '💻', label: '写代码' },
  { id: 'data', icon: '📈', label: '查数据' },
  { id: 'analyze', icon: '🧠', label: '分析' }
]

const quickSymbols = computed(() => {
  const t = activeTab.value
  if (t === 'data' || t === 'backtest') {
    const m = t === 'data' ? dataForm.value.market : backtestForm.value.market
    return m === 'us' ? ['AAPL', 'SPY', 'TSLA', 'QQQ'] : ['600519', '000858', '300750', '000333']
  }
  return []
})

function syncMarketFromSymbol() {
  const s = backtestForm.value.symbol
  backtestForm.value.market = (s.startsWith('0') || s.startsWith('3') || s.startsWith('6')) ? 'cn' : 'us'
}

function syncDataMarket() {
  const s = dataForm.value.symbol
  dataForm.value.market = (s.startsWith('0') || s.startsWith('3') || s.startsWith('6')) ? 'cn' : 'us'
}

function renderMarkdown(text) {
  return marked.parse(text, { breaks: true })
}

function sendMessage(e) {
  if (e) e.preventDefault()
  const text = inputText.value.trim()
  if (!text || loading.value) return
  messages.value.push({ role: 'user', content: text })
  inputText.value = ''
  callAI(text)
}

function runBacktest() {
  const f = backtestForm.value
  const labels = { ma_cross: '双均线交叉', rsi: 'RSI均值回归', bollinger: '布林带突破', macd: 'MACD策略', momentum: '动量策略' }
  const marketLabel = f.market === 'cn' ? '🇨🇳 A股' : '🇺🇸 美股'
  const msg = marketLabel + ' 回测 **' + f.symbol + '** 的 **' + (labels[f.strategy] || f.strategy) + '** 策略\n\n周期：' + f.startDate + ' 至 ' + f.endDate + '\n对比基准：' + (f.benchmark || '无') + '\n请给出详细的回测结果报告，包含绩效指标表、资金曲线分析和优化建议。'
  messages.value.push({ role: 'user', content: msg })
  callAI(msg)
}

function generateCode() {
  const f = codeForm.value
  if (!f.prompt.trim()) return
  const msg = '用 **' + (f.lang === 'python' ? 'Python' : 'JavaScript') + '** 写代码：' + f.prompt + '\n请给出完整可运行的代码，附带注释说明。'
  messages.value.push({ role: 'user', content: msg })
  callAI(msg)
}

function queryData() {
  const f = dataForm.value
  const typeLabels = { price: '历史行情', financial: '财务数据', options: '期权链', info: '股票信息' }
  const periodTag = f.type === 'price' ? '（' + f.period + '）' : ''
  const msg = (f.market === 'cn' ? '🇨🇳 A股' : '🇺🇸 美股') + ' 查询 **' + f.symbol + '** 的' + (typeLabels[f.type] || f.type) + periodTag + '\n把查到的数据整理成表格展示。'
  messages.value.push({ role: 'user', content: msg })
  callAI(msg)
}

function analyzeStrategy() {
  const f = analyzeForm.value
  if (!f.description.trim()) return
  const msg = '帮我分析这个量化策略的优缺点、风险点和优化建议：\n' + f.description
  messages.value.push({ role: 'user', content: msg })
  callAI(msg)
}

async function callAI(text) {
  loading.value = true
  scrollToBottom()
  try {
    const result = await callKai(text)
    messages.value.push({ role: 'bot', content: result.text })
  } catch (err) {
    messages.value.push({ role: 'bot', content: '⚠️ 请求出错：' + err.message + '\n\n> 试试重新发送？' })
  }
  loading.value = false
  scrollToBottom()
}

async function saveChat() {
  const msgs = messages.value.filter(m => m.role !== 'system')
  if (msgs.length <= 1) {
    messages.value.push({ role: 'bot', content: '⚠️ 还没有可保存的对话内容。' })
    return
  }
  
  const title = prompt('给这段对话起个标题：', '量化分析 ' + new Date().toLocaleDateString('zh-CN'))
  if (!title) return

  savingChat.value = true
  try {
    const result = await saveChatToGitHub(title, msgs)
    messages.value.push({ role: 'bot', content: `✅ 对话已保存！\n\n📎 [${title}](${result.url})\n🎫 Issue #${result.number}` })
    scrollToBottom()
  } catch (err) {
    messages.value.push({ role: 'bot', content: '⚠️ 保存失败：' + err.message })
  }
  savingChat.value = false
}

async function loadHistory() {
  showHistory.value = true
  loadingHistory.value = true
  try {
    historyList.value = await loadChatHistory()
  } catch (err) {
    historyList.value = []
    console.error('加载历史失败:', err)
  }
  loadingHistory.value = false
}

function openIssue(url) {
  window.open(url, '_blank')
}

onMounted(() => {
  // 页面加载时静默加载历史数量
  loadChatHistory().then(list => {
    if (list.length > 0) {
      historyList.value = list
    }
  }).catch(() => {})
})

function scrollToBottom() {
  nextTick(() => {
    if (messagesRef.value) messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  })
}
</script>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { height: 100%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
body { background: #0f172a; color: #e2e8f0; }

.app { display: flex; flex-direction: column; height: 100vh; }
.header { display: flex; align-items: center; justify-content: space-between; padding: 12px 24px; background: #1e293b; border-bottom: 1px solid #334155; flex-shrink: 0; }
.header-left { display: flex; align-items: center; gap: 10px; }
.logo { font-size: 28px; }
.header-left h1 { font-size: 18px; font-weight: 600; color: #f1f5f9; }
.header-right { display: flex; gap: 4px; }

.tab-btn { padding: 8px 16px; border: 1px solid transparent; border-radius: 8px; background: transparent; color: #94a3b8; cursor: pointer; font-size: 14px; transition: all 0.15s; }
.tab-btn:hover { background: #334155; color: #e2e8f0; }
.tab-btn.active { background: #3b82f6; color: #fff; border-color: #3b82f6; }
.save-btn, .history-btn { padding: 8px 12px; border: 1px solid #334155; border-radius: 8px; background: transparent; color: #94a3b8; cursor: pointer; font-size: 13px; margin-left: 4px; transition: all 0.15s; }
.save-btn:hover, .history-btn:hover { background: #334155; color: #e2e8f0; border-color: #3b82f6; }
.save-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.main { display: flex; flex: 1; overflow: hidden; }
.chat-panel { flex: 1; display: flex; flex-direction: column; min-width: 0; border-right: 1px solid #334155; }
.messages { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 16px; }
.messages::-webkit-scrollbar { width: 6px; }
.messages::-webkit-scrollbar-track { background: transparent; }
.messages::-webkit-scrollbar-thumb { background: #475569; border-radius: 3px; }

.msg { display: flex; gap: 12px; max-width: 85%; }
.msg.user { align-self: flex-end; flex-direction: row-reverse; }
.msg.bot { align-self: flex-start; }
.msg-avatar { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: #334155; font-size: 18px; flex-shrink: 0; }
.msg.user .msg-avatar { background: #3b82f6; }
.msg-content { min-width: 0; }
.msg-name { font-size: 12px; color: #64748b; margin-bottom: 4px; }
.msg-body { background: #1e293b; border-radius: 12px; padding: 12px 16px; line-height: 1.6; font-size: 14px; word-break: break-word; }
.msg.user .msg-body { background: #3b82f6; color: #fff; }

.msg-body p { margin: 6px 0; }
.msg-body h1 { font-size: 18px; margin: 12px 0 8px; color: #f1f5f9; }
.msg-body h2 { font-size: 16px; margin: 10px 0 6px; color: #f1f5f9; }
.msg-body h3 { font-size: 14px; margin: 8px 0 4px; color: #e2e8f0; }
.msg-body strong { color: #facc15; }
.msg-body code { background: #0f172a; padding: 2px 6px; border-radius: 4px; font-size: 13px; font-family: 'SF Mono', 'Fira Code', monospace; }
.msg-body pre { background: #0f172a; border-radius: 8px; padding: 12px; overflow-x: auto; margin: 8px 0; border: 1px solid #334155; }
.msg-body pre code { background: none; padding: 0; }
.msg-body table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 13px; }
.msg-body th, .msg-body td { border: 1px solid #334155; padding: 6px 10px; text-align: left; }
.msg-body th { background: #1e293b; color: #94a3b8; font-weight: 600; }
.msg-body blockquote { border-left: 3px solid #3b82f6; padding-left: 12px; margin: 8px 0; color: #94a3b8; }

.thinking { font-size: 24px; letter-spacing: 4px; color: #64748b; }
.dot { animation: blink 1.4s infinite; }
.dot:nth-child(2) { animation-delay: 0.2s; }
.dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes blink { 0%, 60% { opacity: 0.3; } 30% { opacity: 1; } }

.input-area { display: flex; gap: 8px; padding: 12px 20px; background: #1e293b; border-top: 1px solid #334155; flex-shrink: 0; }
.input-area textarea { flex: 1; resize: none; padding: 10px 14px; border: 1px solid #334155; border-radius: 10px; background: #0f172a; color: #e2e8f0; font-size: 14px; font-family: inherit; outline: none; transition: border-color 0.15s; }
.input-area textarea:focus { border-color: #3b82f6; }
.input-area textarea::placeholder { color: #475569; }
.send-btn { padding: 10px 20px; border: none; border-radius: 10px; background: #3b82f6; color: #fff; font-size: 14px; font-weight: 500; cursor: pointer; transition: background 0.15s; white-space: nowrap; }
.send-btn:hover:not(:disabled) { background: #2563eb; }
.send-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.side-panel { width: 360px; overflow-y: auto; padding: 20px; flex-shrink: 0; }
.side-panel::-webkit-scrollbar { width: 6px; }
.side-panel::-webkit-scrollbar-thumb { background: #475569; border-radius: 3px; }
.panel h3 { font-size: 16px; margin-bottom: 16px; color: #f1f5f9; }

.toggle-group { display: flex; gap: 0; border-radius: 8px; overflow: hidden; border: 1px solid #334155; }
.toggle-btn { flex: 1; padding: 6px 12px; border: none; background: #1e293b; color: #94a3b8; font-size: 13px; cursor: pointer; transition: all 0.15s; }
.toggle-btn:hover { background: #334155; }
.toggle-btn.active { background: #3b82f6; color: #fff; }
.toggle-btn:first-child { border-right: 1px solid #334155; }

.quick-btns { display: flex; gap: 4px; margin-top: 6px; flex-wrap: wrap; }
.chip-btn { padding: 3px 10px; border: 1px solid #334155; border-radius: 12px; background: transparent; color: #64748b; font-size: 12px; cursor: pointer; transition: all 0.15s; font-family: 'SF Mono', 'Fira Code', monospace; }
.chip-btn:hover { border-color: #3b82f6; color: #3b82f6; background: rgba(59,130,246,0.1); }

.form-group { margin-bottom: 14px; }
.form-group label { display: block; font-size: 13px; color: #94a3b8; margin-bottom: 4px; font-weight: 500; }
.form-group input, .form-group select, .form-group textarea { width: 100%; padding: 8px 12px; border: 1px solid #334155; border-radius: 8px; background: #0f172a; color: #e2e8f0; font-size: 14px; outline: none; font-family: inherit; transition: border-color 0.15s; }
.form-group input:focus, .form-group select:focus, .form-group textarea:focus { border-color: #3b82f6; }
.form-group textarea { resize: vertical; min-height: 60px; }
.form-row { display: flex; gap: 10px; }
.form-row .form-group { flex: 1; }
.action-btn { width: 100%; padding: 10px; border: none; border-radius: 10px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: #fff; font-size: 15px; font-weight: 600; cursor: pointer; transition: opacity 0.15s; margin-top: 4px; }
.action-btn:hover:not(:disabled) { opacity: 0.9; }
.action-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 100; }
.modal { background: #1e293b; border: 1px solid #334155; border-radius: 16px; width: 520px; max-height: 70vh; display: flex; flex-direction: column; box-shadow: 0 20px 60px rgba(0,0,0,0.5); }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #334155; }
.modal-header h3 { font-size: 16px; color: #f1f5f9; }
.modal-close { background: none; border: none; color: #64748b; font-size: 18px; cursor: pointer; padding: 4px 8px; border-radius: 6px; }
.modal-close:hover { background: #334155; color: #e2e8f0; }
.modal-body { padding: 16px 20px; overflow-y: auto; flex: 1; }
.modal-loading { text-align: center; color: #64748b; padding: 40px; }
.modal-empty { text-align: center; color: #64748b; padding: 40px 20px; }
.modal-hint { font-size: 13px; margin-top: 12px; color: #475569; }
.history-list { display: flex; flex-direction: column; gap: 8px; }
.history-item { padding: 12px 16px; border: 1px solid #334155; border-radius: 10px; cursor: pointer; transition: all 0.15s; }
.history-item:hover { background: #334155; border-color: #3b82f6; }
.history-title { font-size: 14px; color: #f1f5f9; margin-bottom: 6px; font-weight: 500; }
.history-meta { display: flex; gap: 12px; font-size: 12px; color: #64748b; }

@media (max-width: 768px) { .side-panel { display: none; } .header-right { display: none; } }
</style>
