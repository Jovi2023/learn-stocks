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

- [ ] 移除前端硬编码 token，鉴权下沉到 cors-proxy
- [ ] `marked` 接 DOMPurify
- [ ] 修历史按钮 `loadHistory()` 调用 + 删 `onMounted` 自动拉历史
- [ ] 修 `.github/workflows/deploy.yml` 第二步路径错误
- [ ] `sendMessage` 加 IME `isComposing` 守卫

### P1 - 工程化（1 天）

- [ ] 拆 `App.vue` 为多个组件 + composables
- [ ] 决定 chart.js / highlight.js：真接上 or 卸掉
- [ ] 删 `responses.js` 死代码，只保留 `welcomeMsg`
- [ ] vite dev proxy + 区分 dev/prod baseUrl
- [ ] `callKai` 加 AbortController + 取消按钮

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

## 7. 开会话时的工作流

每个新对话遵循以下节奏：

1. **开场**：用户告诉我"这一轮要做 X"
2. **我做**：先读本文件 + 路线图，确认目标在第几节
3. **执行**：动手改代码，按"一个 PR 一件事"
4. **收尾**：
   - 运行 lint / build 自检
   - 列出本次改动清单
   - 更新本文件第 6 节的 checkbox
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
- ❗ 删 `responses.js` 之前确认所有 import 都已替换

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
