import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// dev 时 /v1/* 和 /api/* 都转发到本地 cors-proxy (18888)
// cors-proxy 内部自己分发：/api/* → github-proxy:18889；其他 → gateway:18789
// 这样 npm run dev 不再依赖 frpc 隧道，也不消耗公网 Gateway 配额
const DEV_PROXY_TARGET = 'http://127.0.0.1:18888'

export default defineConfig({
  plugins: [vue()],
  // 生产：console.jovi-trade.cn 根路径；GitHub Pages 自定义域名指向 dist 根目录
  base: '/',
  server: {
    proxy: {
      '/v1': { target: DEV_PROXY_TARGET, changeOrigin: true },
      '/api': { target: DEV_PROXY_TARGET, changeOrigin: true },
    },
  },
})
