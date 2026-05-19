#!/bin/bash
# 启动量化控制台的 API 隧道
# 运行方式: bash start-tunnel.sh

set -e

CORS_PROXY="$HOME/jovi2026/quant-console/cors-proxy.cjs"

echo "🜁 启动量化控制台 API 隧道..."
echo ""

# 1. 检查 Serveo 是否已运行
if pgrep -f "serveo.net" > /dev/null 2>&1; then
  echo "⚠️  检测到已有隧道在运行，先停止..."
  pkill -f "serveo.net" 2>/dev/null
  pkill -f "cors-proxy" 2>/dev/null
  sleep 2
fi

# 2. 启动 CORS 代理
echo "📡 启动 CORS 代理 (localhost:18888 → 18789)..."
node "$CORS_PROXY" &
CORS_PID=$!
sleep 2
if kill -0 $CORS_PID 2>/dev/null; then
  echo "   ✅ CORS 代理已启动 (PID: $CORS_PID)"
else
  echo "   ❌ CORS 代理启动失败"
  exit 1
fi

# 3. 启动 Serveo 隧道
echo "🔗 启动 Serveo 内网穿透..."
ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=30 -R 80:localhost:18888 serveo.net 2>&1 &
TUNNEL_PID=$!
sleep 6

# 提取 URL
LOG_FILE="/tmp/serveo_tunnel.log"
# Tunnel URL 会打印在 stdout 上，我们无法从 bg 进程直接读
# 请手动查看终端输出

echo ""
echo "✅ 隧道已启动！"
echo ""
echo "请在 Serveo 输出的日志中找到 URL 格式如下："
echo "  Forwarding HTTP traffic from https://xxx.serveousercontent.com"
echo ""
echo "找到后，更新 src/utils/api.js 中的 baseUrl"
echo ""
echo "按 Ctrl+C 停止隧道"

# 保持脚本运行
wait
