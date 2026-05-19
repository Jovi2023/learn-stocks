#!/bin/bash
# 保活守护脚本 - 确保 frp 和相关服务持续运行
# 配置为 crontab 模式：每分钟检查一次

FRPC="$HOME/.npm-global/bin/frpc"
FRPC_CONF="$HOME/.openclaw/frpc.toml"
CORS_PROXY="$HOME/jovi2026/quant-console/cors-proxy.cjs"
GITHUB_PROXY="$HOME/jovi2026/quant-console/github-proxy.cjs"
LOG_DIR="$HOME/.openclaw/logs"
mkdir -p "$LOG_DIR"

# 加载 GITHUB_TOKEN
[ -f "$HOME/.openclaw/github.env" ] && export $(grep -v '^#' "$HOME/.openclaw/github.env" | xargs)

check_and_start() {
  local name="$1"
  local cmd="$2"
  local log="$3"
  if ! pgrep -f "$name" > /dev/null 2>&1; then
    echo "[$(date)] $name 已停止，重启..."
    nohup bash -c "$cmd" >> "$log" 2>&1 &
    sleep 2
  fi
}

# frpc 需要保留日志文件
FRPC_LOG="$LOG_DIR/frpc.log"
check_and_start "frpc" "$FRPC -c \"$FRPC_CONF\" 2>&1 | tee -a \"$FRPC_LOG\"" "$FRPC_LOG"

check_and_start "cors-proxy.cjs" "node \"$CORS_PROXY\"" "$LOG_DIR/cors-proxy.log"

if [ -n "$GITHUB_TOKEN" ]; then
  check_and_start "github-proxy.cjs" "GITHUB_TOKEN=$GITHUB_TOKEN node \"$GITHUB_PROXY\"" "$LOG_DIR/github-proxy.log"
fi

# 测试隧道是否可用（快速 TCP 连接）
for port in 8080 8888; do
  nc -zv -G 5 "101.32.186.116" "$port" > /dev/null 2>&1
  if [ $? -ne 0 ]; then
    echo "[$(date)] 隧道 $port 不可用，frpc 可能已断开"
    pgrep -f "frpc" | xargs kill -9 2>/dev/null
    sleep 1
    nohup bash -c "$FRPC -c \"$FRPC_CONF\" 2>&1 | tee -a \"$FRPC_LOG\"" >> "$FRPC_LOG" 2>&1 &
  fi
done
