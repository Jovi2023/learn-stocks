# AGENTS.md — 凯的量化控制台

> 本文件是 **跨会话的项目长期记忆**。
> 每次新对话开始，AI 应先读本文件以快速对齐上下文。
> 完整背景与路线图：见第 6.2 节（2026-05-22 项目审计后的待办路线图）

---

## 1. 项目目标（不变的部分）

**对话-first 的 AI 量化助手**。差异化定位：

- ✅ 对话框为主入口，右侧四个工具面板（回测 / 写代码 / 查数据 / 分析）
- ✅ 浏览器内 Pyodide 沙箱跑 Python（计划中，差异化核心）
- ✅ Chart.js 渲染回测图表（计划中）
- ✅ 美股 + A 股双市场支持

**明确不做**（节省精力 + 避免合规风险）：

- ❌ 实盘交易 / 券商对接
- ❌ 收费投资建议 / 投顾
- ❌ 用户登录系统（先用 IndexedDB 本地存档）
- ❌ A 股实时行情（数据成本不可承受）

对标参考：Composer.trade 早期版本、OpenBB MVP。
**不要试图复刻**：QuantConnect / 聚宽（资本和数据门槛太高）。

---

## 2. 技术栈与约束

| 维度 | 选型 | 说明 |
|---|---|---|
| 框架 | Vue 3 `<script setup>` | 不引入 TypeScript（小项目不值） |
| 构建 | Vite | `base: '/learn-stocks/quant-console/'` 别动 |
| 状态 | 暂用 ref / composables | 数据量起来再上 Pinia |
| Markdown | `marked` + `DOMPurify` + `marked-highlight` | DOMPurify 是安全红线，必须有；marked-highlight 是 marked v18+ 接代码高亮的官方扩展 |
| 图表 | `chart.js`（已装，待接入） | 等 P3 差异化定 AI 图表 schema 后再接，不要再装别的图表库 |
| 代码高亮 | `highlight.js`（已接入，core + python/javascript/bash/json） | 按需 registerLanguage，要新语言现加；主题 atom-one-dark |
| 后端代理 | `cors-proxy.cjs` + `github-proxy.cjs`（dev）+ Cloudflare Worker（prod） | Worker 已部署生产；本地 cjs 保留做 dev fallback |
| 部署 | GitHub Pages（前端） + frp 隧道 + Cloudflare Worker（API） | Worker 已切生产，域名 console.jovi-trade.cn 待指向 |

**禁止引入的大型依赖**：lodash 全量、moment、jQuery、第二个图表库、第二个 markdown 库。

---

## 3. 安全红线（不可妥协）

1. **任何 token / secret 绝不进前端代码**——必须由 proxy 注入
2. **所有 markdown / HTML 渲染必须经 DOMPurify**——`v-html` 不能直接拼 `marked.parse(...)`
3. **CORS 不能保持 `*` 配公网域名**——上线前必须收紧到自有域名
4. **`.env` / `*.env` / `frpc.toml` 永远不进 git**——参考 `.gitignore`
5. **不在前端做"用户提供 token"的事**——除非明确是 BYO（用户自己输入自己的 API key）

---

## 4. 代码规范

### Vue 组件

- 一个文件 **不超过 200 行**（所有组件均 ≤100 行，已达标）
- 业务逻辑抽到 `src/composables/use*.js`
- 组件命名 PascalCase：`BacktestPanel.vue`
- 重复 2 次以上的逻辑（如 `syncMarketFromSymbol` / `syncDataMarket`）必须抽出来

### JS 规约

- 不写 obvious 注释（`// 增加 1` 这种）
- 函数参数 ≤4 个，超过用对象
- `fetch` 必须带 `AbortSignal` 超时
- 不要 try/catch 后 swallow（`catch(e){}` 禁止）

### 提交规约

- **一个 PR 一件事**——不要堆功能
- commit message 用中文 + semantic 前缀：`feat: 加 Pyodide 沙箱` / `fix: 历史按钮无响应`
- 禁止 commit：`dist/`、`node_modules/`、`*.log`、`*.env`

---

## 5. 目录约定

```
quant-console/
├── AGENTS.md                    # 本文件
├── README.md                    # 给用户看的说明
├── src/
│   ├── App.vue                  # 布局 + tab 切换（拆完后 ≤100 行）
│   ├── main.js
│   ├── components/
│   │   ├── ChatPanel.vue
│   │   ├── HistoryModal.vue
│   │   └── panels/
│   │       ├── BacktestPanel.vue
│   │       ├── CodePanel.vue
│   │       ├── DataPanel.vue
│   │       └── AnalyzePanel.vue
│   ├── composables/             # 业务逻辑钩子
│   │   ├── useChat.js
│   │   ├── useStorage.js
│   │   └── useMarketDetect.js
│   └── utils/
│       ├── api.js               # callKai
│       └── markdown.js          # marked + DOMPurify
└── workers/                     # 计划新增：Cloudflare Worker 源码
    └── github-proxy.js
```

---

## 6. 当前进度（每个 PR 完成后更新此处）

### 🚨 计划外紧急修复（已完成）

- [x] **frp token 泄露事件处理**（2026-05-19 晚）
  - 起因：`quant-console/frpc.toml` 含明文 token 被 commit 到公开 repo
  - 处置：
    1. 服务端轮换 frp token（旧值 `kai-quant-tunnel-2026` 已作废）
    2. Mac frpc 同步新 token，验证隧道通路 OK
    3. git-filter-repo 清除 `frpc.toml` 所有历史（28→27 commits）
    4. force push 覆盖远程（`ffafd12 → d865f48`）
    5. GitHub 搜索旧 token 已 0 结果
  - 备份：`~/jovi2026-backup/learn-stocks-mirror-20260519-235358.git`（7 天后可删）

### P0 - 安全与紧急 bug（半天）

- [x] **移除前端硬编码 token，鉴权下沉到 cors-proxy**（2026-05-20，commit `442801e`）
  - 前端 `src/utils/api.js` 删除 `token` 字段和 `Authorization` header
  - `cors-proxy.cjs` 直接读 `~/.openclaw/kai.env`（也支持 `KAI_API_TOKEN` env），转发 Gateway 时主动剥掉浏览器送来的 `authorization` 并注入服务端 token
  - 启动脚本命令行**不再传 token 字面量**（避免 `ps -ef` 泄露）
  - 顺手修了 `start-tunnel.sh` / `keepalive.sh` 里 `$HOME/jovi2026/quant-console/...` 的坏路径，纠正为 `$HOME/jovi2026/learn-stocks/quant-console/...`
  - **已完成 Gateway token 轮换**：`openclaw.json` 的 `gateway.auth.token` 与 `~/.openclaw/kai.env` 同步换成 `openssl rand -hex 24` 生成的新值，旧值 `7c1f4adfe5...` 现在打 gateway 直接 401
  - 备份：`~/.openclaw/openclaw.json.before-rotate-20260520-102328`、`~/.openclaw/kai.env.before-rotate-20260520-102328`（7 天后可删）
- [x] **github-proxy 同款鉴权下沉 + GitHub PAT 轮换**（2026-05-20，commit `921d45d`）
  - `github-proxy.cjs` 启动时从 `~/.openclaw/github.env` 自读 token，命令行不再带 `GITHUB_TOKEN=ghp_xxx`，`ps -ef` 看不到
  - 旧 classic PAT (`ghp_vZY...`，仓库 `repo` 全权限、永不过期) 已替换为 fine-grained PAT（`github_pat_...`，仅 `Jovi2023/learn-stocks` 的 Issues:write + Metadata:read，90 天到期）
  - 端到端验证通过：cors-proxy → github-proxy → api.github.com 成功创建并立刻 close 测试 Issue #4
- [x] **`marked` 接 DOMPurify**（2026-05-20）
  - 新增 `src/utils/markdown.js`：`marked.parse → DOMPurify.sanitize`，并通过 hook 给所有 `<a>` 加 `target="_blank" rel="noopener noreferrer"` 防 reverse tabnabbing
  - `App.vue` 改用新模块，删本地 `renderMarkdown` 函数
  - bundle +24 kB（gzip +9 kB），可接受
  - 8 项 XSS 测试全过：`<script>` / `onerror=` / `javascript:` URL / `<iframe>` / `<svg/onload>` 全部失活
- [x] **修历史按钮 `loadHistory()` 调用 + 删 `onMounted` 自动拉历史**（2026-05-20）
  - 历史按钮 `@click` 从 `showHistory = !showHistory` 改为 `loadHistory`，点击触发真正的 API 拉取并显示 modal；关闭走 modal 内 ✕ 按钮 / overlay 点击（原本就支持）
  - 删 `onMounted` 静默拉历史块——既省一次每页加载的 GitHub API 调用，又移除了 swallow 错误的 `catch(() => {})`（违反 AGENTS.md 第 4 节规约）
  - 同步删 `onMounted` 的 import
- [x] **修 `.github/workflows/deploy.yml` 第二步路径错误**（2026-05-20，误报澄清 + 配套清理）
  - 评估时的担忧：`cp -r dist 已存在目录` 会嵌套到 `dist/quant-console/dist/`
  - 实际：vitepress build **不会**把 `docs/quant-console/` 自动拷进 `docs/.vitepress/dist/`（只处理 .md），所以 cp 目标不存在 = 正确的"重命名拷贝"；线上 bundle hash 与本地构建一致，三次 Actions run 全 success
  - 顺手清理（防未来变成真 bug）：
    - `git rm -r docs/quant-console/` —— 把手动 commit 进去的 4 个构建产物清掉，CI 是唯一构建源
    - `git rm quant-console/.github/workflows/deploy.yml` —— 这个文件不在 repo 根 `.github/`，永远不会被 Actions 识别，留着只是混淆
    - `.gitignore` 加 `docs/quant-console/` 防再次提交
- [x] **`sendMessage` 加 IME `isComposing` 守卫**（2026-05-20）
  - 中文输入法选词期间按 Enter 是「确认候选词」，不该当作发送；判断 `e.isComposing === true` 时早退

### P1 - 工程化（1 天）

- [x] **拆 `App.vue` 为多个组件 + composables**（2026-05-20）
  - `App.vue` 411 行 → 78 行（仅顶层布局 + 事件转发，≤100 行红线达成）
  - 新建组件：`AppHeader`、`ChatPanel`、`HistoryModal`、`panels/{Backtest,Code,Data,Analyze}Panel`
  - 新建 composables：`useChat`、`useChatStorage`、`useMarketDetect`（A 股 / 美股自动判别 + quick symbols）
  - CSS 抽到 `src/style.css`，`main.js` 引入；保持全局选择器不变（行为零回归）
  - `ChatPanel` 内部用 `watch` 监听 `messages.length` / `loading` 自动滚到底，父组件不再持 ref
  - 所有 Vue 组件单文件均 ≤100 行，符合规约
- [x] **决定 chart.js / highlight.js：真接上 or 卸掉**（2026-05-20，commit `58923f4`）
  - **highlight.js**：接上 —— `markdown.js` 接 `marked-highlight` 扩展 + 按需注册 4 门语言（python / javascript / bash / json）+ atom-one-dark 主题；inline code 不变，fenced code block 内 token 着色生效
  - 项目深蓝代码块底色保留（`.msg-body pre code { background: none }` 让 hljs 主题的 `.hljs { background }` 让位），仅借用 hljs 的 token 颜色，视觉与项目风格一致
  - **chart.js**：保留不接 —— 真接需要先定 AI 输出图表数据的 schema（属于 Prompt 工程 + 前端协议设计），归入 P3 差异化那波专门做
  - 新增依赖：`marked-highlight`（marked 官方同套件扩展，约 5kB）
  - XSS 路径未变：hljs.highlight 输出已 escape 所有 HTML 特殊字符，DOMPurify 默认允许 `<span class="hljs-*">` 且 hook 只动 `<a>`，即便 hljs 出 bug 也有 DOMPurify 兜底
  - bundle: 145.52 kB → 180.93 kB（gzip 52.67 → 65.88，+13.2kB），符合 hljs core + 4 语言 + 主题 CSS 的预算
- [x] **删 `responses.js` 死代码**（2026-05-20，commit `fb937cb`）
  - `welcomeMsg` 内联到 `useChat.js`（13 行常量，全局唯一引用点，独立文件不划算）
  - 删除 `src/utils/responses.js` 整文件——`backtestReply` / `codeReply` / `dataReply` / `analyzeReply` / `defaultReply` 等 mock 时代的死代码全部清除
  - 顺手从第 9 节危险操作清单移除"删 responses.js 之前确认所有 import 都已替换"——文件没了，告警 N/A
- [x] **vite dev proxy + 区分 dev/prod baseUrl**（2026-05-20，commit `58923f4`）
  - `vite.config.js` 加 `server.proxy`：`/v1` 和 `/api` 都转到 `http://127.0.0.1:18888`（cors-proxy 自己内部分发到 gateway / github-proxy）
  - `api.js` 导出 `API_BASE_URL = import.meta.env.DEV ? '' : 'https://api.jovi-trade.cn'`，`API_CONFIG.baseUrl` 复用
  - `storage.js` 改用 `${API_BASE_URL}/api/save-chat`，不再硬编码公网域名（之前完全漏改）
  - 收益：`npm run dev` 不再依赖 frpc 隧道，本地直连 cors-proxy，调试更快、不消耗 Gateway 配额
  - 自检：prod build 产物里 `https://api.jovi-trade.cn` 字符串仍在（minify 后合并为 1 份引用），bundle 145.52 kB / gzip 52.67 kB
- [x] **`callKai` 加 AbortController + 取消按钮**（2026-05-20，commit `fb937cb`）
  - `callKai(input, { signal })` 接受可选 `AbortSignal`，透传给 `fetch`
  - `useChat` 内部 `AbortSignal.any([userCtrl.signal, AbortSignal.timeout(120_000)])` 合成「用户取消 + 120s 超时」双信号，并 `export cancel()`
  - 错误分支三态：用户主动取消（`⏹ 已取消生成。`）/ 超时（`⏱ 请求超时…`）/ 其他错误（沿用原文案），靠 `userCtrl.signal.aborted` 区分前两者
  - `ChatPanel` 发送按钮在 `loading` 时变身红色 ⏹ 停止，单击 emit `cancel`；loading 时按 Enter 早退避免误触
  - 顺手补齐 AGENTS.md 第 4 节「fetch 必须带 AbortSignal 超时」的规约——之前是欠的
  - build 通过：145.53 kB / gzip 52.67 kB，无明显增长

### P2 - 云化与移动化（2 天）

- [x] **`github-proxy.cjs` 改写为 Cloudflare Worker**（2026-05-20，已部署验证）
  - Worker 源码：`quant-console/workers/github-proxy.js`，Module Worker（ESM 风格），1:1 复刻 `github-proxy.cjs` 的 issue body 格式（保证旧 issues 视觉一致）
  - 与 `.cjs` 版本相比的安全收紧：
    - **CORS 不再 `*`** —— 按 `ALLOWED_ORIGINS` 白名单回显 origin，未匹配的请求浏览器自然拒收（AGENTS.md 第 3 节红线第 3 条达成）
    - **payload 校验** —— title ≤200 字符、messages ≤100 条、单条 content ≤50k，避免被滥用灌爆 Issues
    - GITHUB_TOKEN 走 `wrangler secret put`（CF 边缘加密存储），不在 `wrangler.toml` 里
  - 部署配置：`quant-console/workers/wrangler.toml`，`vars` 包含 `REPO_OWNER` / `REPO_NAME` / `ALLOWED_ORIGINS`，白名单含 GitHub Pages 域、未来的 `console.jovi-trade.cn`、本地 dev 端口 5173/5174
  - **workers.dev 路由**：子域 `jovi2023.workers.dev`；`wrangler.toml` 显式 `workers_dev = true`（首次 deploy 失败在子域注册前会导致「无活动路由」+ curl `error code: 1042`，子域注册后必须 redeploy）
  - **生产 URL**：`https://kai-github-proxy.jovi2023.workers.dev/api/save-chat`
  - 前端 endpoint 切换：`storage.js` 按 `VITE_GITHUB_PROXY_URL`（`.env.production`）→ fallback `${API_BASE_URL}/api/save-chat`
  - 端到端验证：curl POST 返回 `200 {"success":true,"url":".../issues/5","number":5}`（测试 Issue #5，用户侧待关闭）
  - `.gitignore` 加 `.wrangler/` 和 `workers/.dev.vars`
  - **不动**项：`github-proxy.cjs` / `cors-proxy.cjs` / `start-tunnel.sh` 保留，dev 模式仍走本地链路；Mac 关机后 ☁️ 上传仍可用
- [ ] 域名 `console.jovi-trade.cn` 指向 Workers
- [x] **移动端 side-panel → 底部 Drawer**（2026-05-20）
  - 桌面端零变化（≥769px 不走 drawer 分支，原 flex 布局 + side-panel:360px 保持）
  - 移动端 ≤768px：
    - Header 不再 `display:none` 整段隐藏；`<h1>` 标题文字隐藏（保留 logo），tab/save/history 按钮变 icon only（label 套 `<span class="btn-label">` 由 CSS 隐藏，文案靠 `:title` / `aria-label` 兜底无障碍）
    - `.side-panel` 改为 `position: fixed; bottom: 0` 底部抽屉，`transform: translateY(100%)` 关闭态、`.drawer-open` 滑出，圆角顶 + 抓手条 + 阴影 + 半透明 overlay
    - **触发**：点 Header 任一 tab → drawer 滑出（沿用桌面端"点 tab 切右栏"的肌肉记忆）
    - **关闭**：✕ 按钮 / 点 overlay / 点任一 panel 的"🚀 跑回测"等 action（提交 prompt 同时收起 drawer，让用户立刻看到聊天区）
  - 顺手把 `onSave` 整段下沉到 `useChatStorage.save(messages)`：包含 prompt 起标题 + filter system msg + 反馈消息 + savingChat loading 态。`App.vue` 从 78 行 → 74 行（保住 ≤100 红线，原 onSave 16 行下沉后腾出空间放 drawer 状态与 handler）
  - `AppHeader.vue` 每个按钮的文字独立成 `<span class="btn-label">`，桌面照常显示；移动端用 `.btn-label { display: none }` 一键隐藏
  - bundle: JS 180.93 → 181.49 kB（gzip 65.88 → 66.09，+0.21 kB），CSS 新增 8.96 kB / gzip 2.49 kB（drawer + mobile 共约 60 行 CSS）
  - 无 lint 错误，build 通过
- [x] **IndexedDB 替代 GitHub Issues 做对话存档**（2026-05-20）
  - 双轨方案落地：默认 💾 → IndexedDB；新增 ☁️ 上传按钮可选把当前对话同步到 GitHub Issues（复用现有 `saveChatToGitHub` / github-proxy 链路）。后续 PR 若决定换 Gist endpoint，只动 `storage.js` + github-proxy 一处，前端无感
  - 新增 `src/utils/localStore.js`：用 `idb-keyval` 极薄封装 IndexedDB CRUD（`saveLocalChat` / `listLocalChats` / `deleteLocalChat`），DB 名 `quant-console` / store `chats`，id 形如 `chat_<ts>_<rand>`，schema `{ id, title, created, messages }`
  - `useChatStorage` 扩为 5 个 action：`save`（→ 本地）/ `upload`（→ 云）/ `loadHistory`（读本地）/ `removeFromHistory`（删本地）/ `closeHistory`，并暴露 `savingChat` / `uploadingChat` 两个 loading ref
  - `AppHeader` 在 💾 保存和 📋 历史之间塞了第 7 个按钮 ☁️ 上传（icon-only 在移动端 ≤768px 仍能放下 iPhone 13 Pro 390px 宽度），文案中性"上传"不说 Gist
  - `HistoryModal` 重写 schema：本地 `{ id, title, created, messages.length }` 渲染；新增 🗑 删除按钮（带 confirm()）+ footer 提示「数据存浏览器本地，换浏览器看不到」；移除"整条点击打开 issue 页"行为（本 PR 暂不做恢复对话功能）
  - **不迁移历史**：旧的 GitHub Issues 历史留云端，新数据默认进 IndexedDB；用户若想再次访问旧云端历史，可手动在 GitHub repo 里查 label `quant-console` `chat-log` 的 Issues
  - 顺手删 `storage.js` 里的 `loadChatHistory`（已无人引用），文件从 46 行 → 21 行
  - 新依赖：`idb-keyval@^6.2.2`（~1kB gzip，路线图明示）
  - bundle: JS 181.49 → 184.24 kB（gzip 66.09 → 67.18，+1.09 kB），CSS +0.08 kB gzip，符合 idb-keyval + 50 行新业务代码的预算
  - 无 lint 错误，build 通过

### P3 - 差异化（核心卖点）

- [ ] 接 Chart.js，AI 返回结构化数据时画图
- [ ] 接 Pyodide，代码块"▶ 运行"按钮
- [x] **代码块"📋 复制"按钮**（2026-05-27）
  - `markdown.js`：`wrapCodeBlocks` 给每个 `<pre>` 包 `.code-block-wrap` + `.code-copy-btn`（经 DOMPurify 后再进 `v-html`）
  - `useCodeCopy.js`：`.messages` 事件委托，`navigator.clipboard.writeText` 取 `pre code` 纯文本；成功 2s「已复制」反馈，失败写 `title`
  - `style.css`：按钮悬停/聚焦显示，右上角绝对定位，`pre` 右侧留空防遮挡
  - 仅 fenced code block，inline `` ` `` 不加按钮

### P4 - 起势

- [ ] ESLint + Prettier
- [ ] 录 30s 演示视频
- [ ] 提交 ProductHunt

---

## 6.1 用户侧待办（AI 不能代劳，新会话开场必须先提醒用户）

### Pending

> 当前无 pending 待办。

### 已完成

- [x] **Delete 测试 Issue #5**（2026-05-20）
  - Worker 端到端验证 curl 临时创建的 `[ci-test] worker e2e` Issue，部署验证通过后应关闭

### 已完成

- [x] **Delete 旧 classic PAT `quant-console`**（2026-05-20）
  - github-proxy 已切到 fine-grained PAT（commit `921d45d`）并端到端验过，旧 classic PAT `ghp_vZY...` 已从 https://github.com/settings/tokens 移除
- [x] **Delete 测试 Issue #4**（2026-05-20）
  - 2026-05-20 PAT 轮换时为端到端验证临时创建的 `[ci-test]` Issue，已删除

---

## 7. 开会话时的工作流

每个新对话遵循以下节奏：

1. **开场**：用户告诉我"这一轮要做 X"
2. **我做**：先读本文件 + 路线图，**先扫一眼第 6.1 节用户侧待办**——如果未清空就提醒用户
3. **执行**：动手改代码，按"一个 PR 一件事"
4. **收尾**：
   - 运行 lint / build 自检
   - 列出本次改动清单
   - 更新本文件第 6 节的 checkbox（带上 commit hash 方便回溯）
   - 提示用户 commit

---

## 8. 常用脚本备忘

```bash
npm run dev      # 本地开发，/v1 + /api 经 vite proxy → 127.0.0.1:18888（前提：先跑 start-tunnel.sh）
npm run build    # 输出到 dist/，baseUrl 自动切换为公网 https://api.jovi-trade.cn
npm run preview  # 预览 dist/（走公网，可不开本地隧道）

# 启动本地后端服务
bash start-tunnel.sh      # 启动 frpc + 两个 proxy（cors-proxy:18888、github-proxy:18889）
bash keepalive.sh         # crontab 每分钟跑一次的守护

# 部署前端
git push origin main      # 触发 .github/workflows/deploy.yml
```

### Cloudflare Worker（github-proxy 云化版）部署

```bash
cd quant-console/workers

# 0. 首次：装 wrangler（全局或用 npx）
npm i -g wrangler

# 1. 登陆 Cloudflare（浏览器会跳一下）
wrangler login

# 2. 注入 GitHub fine-grained PAT 作为 secret
#    粘贴当前在用的 PAT（仅 Jovi2023/learn-stocks 的 Issues:write + Metadata:read）
wrangler secret put GITHUB_TOKEN

# 3. 部署
wrangler deploy

# 4. 端到端验证（替换 <sub> 为你的 workers.dev 子域）
curl -X POST https://kai-github-proxy.<sub>.workers.dev/api/save-chat \
  -H "Content-Type: application/json" \
  -H "Origin: https://jovi2023.github.io" \
  -d '{"title":"[ci-test] worker e2e","messages":[{"role":"user","content":"hi"}]}'
# 期望：200 + {success: true, url: "...", number: N}
# 验证完去 GitHub 把这条测试 Issue 关掉

# 5. 拿到 URL 后告诉 AI，会做第二个 commit：
#    quant-console/.env.production 里写 VITE_GITHUB_PROXY_URL=<url>/api/save-chat
#    然后 npm run build 验证 bundle 里这个 URL 是否注入正确，再 push 触发部署
```

> 部署完成、端到端验证完毕 + GitHub Pages 那侧切到 Worker URL 之后，才能停 Mac 上的 github-proxy（改 `start-tunnel.sh` 不再启 18889）。在那之前 dev 与 prod 都依赖本地 github-proxy.cjs 作为 fallback。

---

- [x] **仓库精简为 quant-console 唯一项目**（2026-05-22，commit `60cfbed` / `10ababe`）
  - 删除 VitePress 博客（23 篇 .md + 配置）
  - 重写 deploy.yml 为纯 quant-console 构建流程
  - 修复 Pages 部署路径嵌套问题（`_site/learn-stocks/quant-console/` → `_site/quant-console/`）
  - 更新 `.gitignore` 移除 VitePress 规则

### 🆕 2026-05-22 全量审计发现（deepseek-v4-pro）

> 详细评估见 `quant-console-评估与路线图.md`（仓库外 untracked，2026-05-19 初始版已基本全部完成）。以下为本次审计新增问题。

| # | 级别 | 问题 | 位置 | 说明 |
|---|---|---|---|---|
| 1 | 🔴 | cors-proxy CORS 仍为 `*` | `cors-proxy.cjs` | Worker 侧已收紧白名单，cors-proxy 未同步——违反红线第 3 条。`api.jovi-trade.cn` 公网入口等价全开放 |
| 2 | 🔴 | 历史对话不可恢复 | `HistoryModal.vue` + `useChatStorage.js` | 列表只展示和删除，点条目无反应。IndexedDB 存了完整 messages 但漏了 `restoreChat(id)` |
| 3 | 🔴 | README.md 是脚手架模板 | `README.md` | 内容为 `Vue 3 + Vite` 默认文案，无项目说明 |
| 4 | 🟡 | untracked 评估文档 | 仓库根 | `quant-console-评估与路线图.md` 未进 git；AGENTS.md 已取代其进度功能 |
| 5 | 🟡 | keepalive.sh 环境变量解析 bug | `keepalive.sh` | `export $(grep ... | xargs)` 在 token 值含空格/特殊字符时崩溃 |
| 6 | 🟡 | useChatStorage 重复逻辑 | `useChatStorage.js` | `save()` 和 `upload()` 结构高度重复（检查→prompt→loading→try/catch→push），可抽 `withTitleAction` |
| 7 | 🟡 | A 股识别正则过粗 | `useMarketDetect.js` | `startsWith('0')` 匹配任何以 0 开头的字符串（如 `NOTHING`），应加 `/^\d{6}$/` |
| 8 | 🟢 | 无 rate limit | `cors-proxy.cjs` + Worker | 两个代理端均无请求频率限制，极端下会被刷 API 额度 |
| 9 | 🟢 | 无键盘快捷键 | 全局 | 缺 Ctrl+Enter 发送、Tab 切换面板 |
| 10 | 🟢 | 无离线/断连提示 | `useChat.js` | 后端不可用时只显示通用错误，无法区分网络故障 vs API 超时 |

### 审计 P0 修复（2026-05-22）

- [x] **恢复对话功能** — `getLocalChat` + HistoryModal 点击恢复 + `useChat.restore()`；有用户消息时 confirm 防误覆盖
- [x] **收紧 cors-proxy CORS 白名单** — 与 Worker 对齐（`jovi2023.github.io` / `console.jovi-trade.cn` / localhost），支持 `ALLOWED_ORIGINS` env 覆盖
- [x] **重写 README.md** — 替换 Vue 脚手架模板，补功能/开发/部署/安全说明

### 审计 P1 修复

- [x] **修复 keepalive.sh / start-tunnel.sh 环境变量解析** — 抽 `load-env.sh`，逐行 `KEY=VALUE` 加载，避免 `xargs` 在特殊字符 token 下崩溃；脚本路径改 `$SCRIPT_DIR` 相对定位
- [x] **重构 useChatStorage 重复逻辑** — 抽 `withTitleAction`，`save()` / `upload()` 共用
- [x] **修复 A 股检测正则** — `detectMarket` 改为 `/^\d{6}$/`，不再把 `NOTHING` 等误判为 A 股
- [x] **处理 untracked 评估文档** — 决策：保留在仓库外（`~/jovi2026/quant-console-评估与路线图.md`）作 2026-05-19 历史归档；进度维护以本 AGENTS.md 为准，不纳入 git

### 审计 P2/P3 小修（2026-05-27）

- [x] **离线/断连提示**（审计 #10）— `chatError.js` + `useChat`：`Failed to fetch` / `navigator.onLine` / 401 / 5xx 分场景文案，替代笼统 `err.message`
- [x] **键盘快捷键**（审计 #9）— `useKeyboardShortcuts`：Alt+1~4 切右栏 tab；Esc 关历史 modal / 移动 drawer；`ChatPanel` 改为 Ctrl/Cmd+Enter 发送、Enter 换行

### 审计后推荐优先级

| 优先级 | 任务 | 问题 | 预估 |
|---|---|---|---|
| ~~🔴 P0~~ | ~~恢复对话功能~~ | ~~#2~~ | ✅ 已完成 |
| ~~🔴 P0~~ | ~~收紧 cors-proxy CORS 白名单~~ | ~~#1~~ | ✅ 已完成 |
| ~~🔴 P0~~ | ~~重写 README.md~~ | ~~#3~~ | ✅ 已完成 |
| ~~🟡 P1~~ | ~~修复 keepalive.sh 环境变量解析~~ | ~~#5~~ | ✅ 已完成 |
| ~~🟡 P1~~ | ~~重构 useChatStorage 重复逻辑~~ | ~~#6~~ | ✅ 已完成 |
| ~~🟡 P1~~ | ~~修复 A 股检测正则~~ | ~~#7~~ | ✅ 已完成 |
| ~~🟡 P1~~ | ~~处理 untracked 评估文档~~ | ~~#4~~ | ✅ 已完成（保留仓库外归档） |
| ~~🟢 P2~~ | ~~加 rate limit~~ | ~~#8~~ | 待做 |
| ~~🟢 P2~~ | ~~键盘快捷键~~ | ~~#9~~ | ✅ 已完成 |
| ~~🟢 P3~~ | ~~离线/断连提示~~ | ~~#10~~ | ✅ 已完成 |

---

## 9. 危险操作清单（做之前先想想）

- ❗ 改 `vite.config.js` 的 `base` → 部署路径会错
- ❗ 改 `.github/workflows/deploy.yml` → 全站可能 404
- ❗ 改 `cors-proxy.cjs` 的端口（18888）→ frpc 配置要同步改
- ❗ 升 Vue 大版本 → 检查 `<script setup>` 兼容性

---

## 10. 长期记忆与短期记忆的边界

| 该写在哪 | 内容 |
|---|---|
| 本文件 (`AGENTS.md`) | 不变的约定、目标、红线、进度 |
| `quant-console-评估与路线图.md` | 2026-05-19 初始评估报告（原始版，已完成其中全部 P0-P2 项） |
| `.cursor/rules/*.mdc` | 自动加载的硬规矩（每会话强制） |
| 代码注释 | 解释"为什么这么写"，不解释"在做什么" |
| commit message | 解释"这个 PR 改了什么 + 为什么" |
| 对话（chat） | 短期讨论、临时决策——**不可靠**，重要结论必须沉淀到上面四处 |
