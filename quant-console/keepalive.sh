#!/bin/bash
# 保活守护脚本 - 确保 frp 和相关服务持续运行
# 配置为 crontab 模式：每分钟检查一次

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=load-env.sh
source "$SCRIPT_DIR/load-env.sh"

FRPC="$HOME/.npm-global/bin/frpc"
FRPC_CONF="$HOME/.openclaw/frpc.toml"
CORS_PROXY="$SCRIPT_DIR/cors-proxy.cjs"
GITHUB_PROXY="$SCRIPT_DIR/github-proxy.cjs"
LOG_DIR="$HOME/.openclaw/logs"
mkdir -p "$LOG_DIR"

load_env_file "$HOME/.openclaw/github.env"
load_env_file "$HOME/.openclaw/kai.env"

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

# cors-proxy 自行从 ~/.openclaw/kai.env 读 token，命令行不带敏感参数
check_and_start "cors-proxy.cjs" "node \"$CORS_PROXY\"" "$LOG_DIR/cors-proxy.log"

if [ -n "$GITHUB_TOKEN" ]; then
  # github-proxy 自行从 ~/.openclaw/github.env 读 token，命令行不带敏感参数
  check_and_start "github-proxy.cjs" "node \"$GITHUB_PROXY\"" "$LOG_DIR/github-proxy.log"
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
