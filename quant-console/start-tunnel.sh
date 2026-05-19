#!/bin/bash
# 启动 frp 隧道 + CORS 代理
# 用于量化控制台 API 代理

set -e

PATH="$HOME/.npm-global/bin:$PATH"
FRPC_BIN="$HOME/.npm-global/bin/frpc"
FRPC_CONF="$HOME/.openclaw/frpc.toml"
CORS_PROXY="$HOME/jovi2026/quant-console/cors-proxy.cjs"

echo "🜁 启动量化控制台后端服务"
echo ""

# 1. 启动 CORS 代理 (如果还没启动)
if ! pgrep -f "cors-proxy" > /dev/null 2>&1; then
  echo "📡 启动 CORS 代理 (18888 → 18789)..."
  node "$CORS_PROXY" &
  sleep 2
  if pgrep -f "cors-proxy" > /dev/null 2>&1; then
    echo "   ✅ 已启动"
  else
    echo "   ❌ 启动失败"
    exit 1
  fi
else
  echo "📡 CORS 代理已在运行"
fi

# 2. 启动 frp 隧道
if ! pgrep -f "frpc" > /dev/null 2>&1; then
  echo "🔗 启动 frp 隧道 → 101.32.186.116..."
  nohup "$FRPC_BIN" -c "$FRPC_CONF" > /tmp/frpc.log 2>&1 &
  sleep 3
  if pgrep -f "frpc" > /dev/null 2>&1; then
    echo "   ✅ 隧道已连接"
  else
    echo "   ❌ 隧道启动失败，查看日志: cat /tmp/frpc.log"
    exit 1
  fi
else
  echo "🔗 frp 隧道已在运行"
fi

echo ""
echo "========================================"
echo "✅ 全部就绪！"
echo ""
echo "API 地址（用于配置 api.js）："
echo "  http://101.32.186.116:8080"
echo "  https://你的域名:443（配置域名后）"
echo ""
echo "frp 管理面板："
echo "  http://101.32.186.116:7500"
echo "  用户名: admin  密码: Cm86871402"
echo "========================================"
