#!/bin/bash
# 确保 frp 隧道和代理服务持续运行
# 用法：bash ~/jovi2026/quant-console/start-tunnel.sh

FRPC_CONF="$HOME/.openclaw/frpc.toml"
CORS_PROXY="$HOME/jovi2026/learn-stocks/quant-console/cors-proxy.cjs"
GITHUB_PROXY="$HOME/jovi2026/learn-stocks/quant-console/github-proxy.cjs"
GITHUB_ENV="$HOME/.openclaw/github.env"
KAI_ENV="$HOME/.openclaw/kai.env"
LOG_DIR="$HOME/.openclaw/logs"
mkdir -p "$LOG_DIR"

# 加载 GitHub Token（用于 github-proxy）
if [ -f "$GITHUB_ENV" ]; then
  export $(grep -v '^#' "$GITHUB_ENV" | xargs)
fi

# 加载 Kai API Token（用于 cors-proxy 鉴权注入）
if [ -f "$KAI_ENV" ]; then
  export $(grep -v '^#' "$KAI_ENV" | xargs)
fi

if [ -z "$GITHUB_TOKEN" ]; then
  echo "⚠️ 未设置 GITHUB_TOKEN，保存对话功能将不可用"
fi

if [ -z "$KAI_API_TOKEN" ]; then
  echo "❌ 未设置 KAI_API_TOKEN，cors-proxy 无法启动"
  echo "   echo 'KAI_API_TOKEN=<your-token>' > $KAI_ENV"
  exit 1
fi

# 守护函数：确保进程一直运行
ensure_running() {
  local name="$1"
  local cmd="$2"
  local logfile="$3"
  
  if pgrep -f "$name" > /dev/null 2>&1; then
    echo "✅ $name 已在运行"
  else
    echo "🚀 启动 $name..."
    nohup bash -c "$cmd" > "$logfile" 2>&1 &
    sleep 2
    if pgrep -f "$name" > /dev/null 2>&1; then
      echo "   ✅ 已启动 (PID $(pgrep -f "$name" | head -1))"
    else
      echo "   ❌ 启动失败"
    fi
  fi
}

# 1. frpc
echo ""
echo "=== 启动服务 ==="
ensure_running "frpc" "frpc -c \"$FRPC_CONF\" 2>&1" "$LOG_DIR/frpc.log"

# 2. CORS 代理（鉴权由 cors-proxy.cjs 自行从 ~/.openclaw/kai.env 读，避免 ps 泄露）
ensure_running "cors-proxy.cjs" "node \"$CORS_PROXY\" 2>&1" "$LOG_DIR/cors-proxy.log"

# 3. GitHub 代理
if [ -n "$GITHUB_TOKEN" ]; then
  ensure_running "github-proxy.cjs" "GITHUB_TOKEN=$GITHUB_TOKEN node \"$GITHUB_PROXY\" 2>&1" "$LOG_DIR/github-proxy.log"
fi

echo ""
echo "========================================"
echo "✅ 服务状态："
echo ""
echo "  本地服务："
echo "    Gateway:     http://127.0.0.1:18789"
echo "    CORS 代理:   http://127.0.0.1:18888"
echo "    GitHub 代理: http://127.0.0.1:18889"
echo ""
echo "  公网入口："
echo "    HTTPS API:   https://api.jovi-trade.cn"
echo "    保存对话:    https://api.jovi-trade.cn/api/save-chat"
echo ""
echo "  控制台页面："
echo "    https://jovi2023.github.io/learn-stocks/quant-console/"
echo ""
echo "========================================"

# 如果 frpc 不在运行，每 30 秒检查一次
if ! pgrep -f "frpc" > /dev/null 2>&1; then
  echo "⚠️ frpc 未运行，启动保活监控..."
  while true; do
    sleep 30
    if ! pgrep -f "frpc" > /dev/null 2>&1; then
      echo "[$(date)] frpc 已断开，重新启动..."
      frpc -c "$FRPC_CONF" >> "$LOG_DIR/frpc.log" 2>&1 &
    fi
    # 也检查其他服务
    for proc in "cors-proxy.cjs" "github-proxy.cjs"; do
      if ! pgrep -f "$proc" > /dev/null 2>&1; then
        echo "[$(date)] $proc 已停止，重新启动..."
        case "$proc" in
          "cors-proxy.cjs") node "$CORS_PROXY" >> "$LOG_DIR/cors-proxy.log" 2>&1 & ;;
          "github-proxy.cjs") GITHUB_TOKEN=$GITHUB_TOKEN node "$GITHUB_PROXY" >> "$LOG_DIR/github-proxy.log" 2>&1 & ;;
        esac
      fi
    done
  done
fi
