# 凯的量化控制台

对话优先的 AI 量化助手前端。主界面是对话框，右侧提供回测 / 写代码 / 查数据 / 分析四个工具面板。

**线上地址**：https://jovi2023.github.io/learn-stocks/quant-console/

## 功能

- 与 Kai（OpenClaw Gateway）对话，支持美股 + A 股
- 右侧工具面板快速发起回测、代码、数据、分析类 prompt
- Markdown 渲染 + 代码高亮（DOMPurify 防 XSS）
- 本地对话存档（IndexedDB），可选 ☁️ 上传到 GitHub Issues 备份
- 移动端底部 Drawer 工具面板

## 技术栈

Vue 3 + Vite · marked + DOMPurify · highlight.js · idb-keyval · chart.js（待接入）

## 本地开发

```bash
# 1. 安装依赖
cd quant-console && npm install

# 2. 启动后端（cors-proxy + github-proxy + frpc 隧道）
bash start-tunnel.sh

# 3. 启动前端（/v1 和 /api 经 vite proxy → localhost:18888）
npm run dev
```

开发模式不依赖公网 API，也不消耗 Gateway 配额。

## 生产部署

- **前端**：push 到 `main` 分支，GitHub Actions 自动部署到 Pages
- **AI API**：`https://api.jovi-trade.cn` → frp → Mac 上的 `cors-proxy.cjs`
- **云上传**：Cloudflare Worker `kai-github-proxy.jovi2023.workers.dev`

## 目录

```
quant-console/
├── src/              # Vue 前端
├── workers/          # Cloudflare Worker（github-proxy 云化版）
├── cors-proxy.cjs    # 本地 CORS + 鉴权代理（18888）
├── github-proxy.cjs  # 本地 GitHub Issues 代理（18889，dev fallback）
├── start-tunnel.sh   # 一键启动 frpc + 两个 proxy
└── AGENTS.md         # 项目长期记忆（AI 跨会话上下文）
```

## 安全说明

- API token 不在前端，由 `cors-proxy.cjs` 服务端注入
- Markdown 渲染必经 DOMPurify
- CORS 按白名单收紧（与 Worker 对齐）
- `.env` / token 文件不进 git

## 不做的事

实盘交易 · 收费投顾 · 用户登录 · A 股实时行情
