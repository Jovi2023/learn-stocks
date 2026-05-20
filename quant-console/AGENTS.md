# AGENTS.md — 凯的量化控制台

> 本文件是 **跨会话的项目长期记忆**。
> 每次新对话开始，AI 应先读本文件以快速对齐上下文。
> 完整背景与路线图：`/Users/jovi2026/quant-console-评估与路线图.md`

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
| Markdown | `marked` + `DOMPurify` | DOMPurify 是安全红线，必须有 |
| 图表 | `chart.js`（已装，待接入） | 不要再装别的图表库 |
| 代码高亮 | `highlight.js`（已装，待接入） | 同上 |
| 后端代理 | `cors-proxy.cjs` + `github-proxy.cjs` | 计划迁移到 Cloudflare Workers |
| 部署 | GitHub Pages（前端） + frp 隧道（API） | 部署目标：API 迁 Workers，前端不变 |

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

- 一个文件 **不超过 200 行**（当前 `App.vue` 422 行待拆分）
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
- [ ] 决定 chart.js / highlight.js：真接上 or 卸掉
- [x] **删 `responses.js` 死代码**（2026-05-20）
  - `welcomeMsg` 内联到 `useChat.js`（13 行常量，全局唯一引用点，独立文件不划算）
  - 删除 `src/utils/responses.js` 整文件——`backtestReply` / `codeReply` / `dataReply` / `analyzeReply` / `defaultReply` 等 mock 时代的死代码全部清除
  - 顺手从第 9 节危险操作清单移除"删 responses.js 之前确认所有 import 都已替换"——文件没了，告警 N/A
- [ ] vite dev proxy + 区分 dev/prod baseUrl
- [x] **`callKai` 加 AbortController + 取消按钮**（2026-05-20）
  - `callKai(input, { signal })` 接受可选 `AbortSignal`，透传给 `fetch`
  - `useChat` 内部 `AbortSignal.any([userCtrl.signal, AbortSignal.timeout(120_000)])` 合成「用户取消 + 120s 超时」双信号，并 `export cancel()`
  - 错误分支三态：用户主动取消（`⏹ 已取消生成。`）/ 超时（`⏱ 请求超时…`）/ 其他错误（沿用原文案），靠 `userCtrl.signal.aborted` 区分前两者
  - `ChatPanel` 发送按钮在 `loading` 时变身红色 ⏹ 停止，单击 emit `cancel`；loading 时按 Enter 早退避免误触
  - 顺手补齐 AGENTS.md 第 4 节「fetch 必须带 AbortSignal 超时」的规约——之前是欠的
  - build 通过：145.53 kB / gzip 52.67 kB，无明显增长

### P2 - 云化与移动化（2 天）

- [ ] `github-proxy.cjs` 改写为 Cloudflare Worker
- [ ] 域名 `console.jovi-trade.cn` 指向 Workers
- [ ] 移动端 side-panel → 底部 Drawer
- [ ] IndexedDB 替代 GitHub Issues 做对话存档

### P3 - 差异化（核心卖点）

- [ ] 接 Chart.js，AI 返回结构化数据时画图
- [ ] 接 Pyodide，代码块"▶ 运行"按钮
- [ ] 代码块"📋 复制"按钮

### P4 - 起势

- [ ] ESLint + Prettier
- [ ] 录 30s 演示视频
- [ ] 提交 ProductHunt

---

## 6.1 用户侧待办（AI 不能代劳，新会话开场必须先提醒用户）

> 当前无 pending 待办。下次有新增（如 token 轮换、第三方账号设置）再列在此处。

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
npm run dev      # 本地开发，将走 vite proxy → 127.0.0.1:18888
npm run build    # 输出到 dist/
npm run preview  # 预览 dist/

# 启动本地后端服务
bash start-tunnel.sh      # 启动 frpc + 两个 proxy
bash keepalive.sh         # crontab 每分钟跑一次的守护

# 部署
git push origin main      # 触发 .github/workflows/deploy.yml
```

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
| `quant-console-评估与路线图.md` | 一次性的分析报告、对标参考、完整 checklist |
| `.cursor/rules/*.mdc` | 自动加载的硬规矩（每会话强制） |
| 代码注释 | 解释"为什么这么写"，不解释"在做什么" |
| commit message | 解释"这个 PR 改了什么 + 为什么" |
| 对话（chat） | 短期讨论、临时决策——**不可靠**，重要结论必须沉淀到上面四处 |
