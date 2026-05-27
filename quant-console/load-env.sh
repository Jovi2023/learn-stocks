# 从 KEY=VALUE 文件加载环境变量（供 start-tunnel.sh / keepalive.sh source）
# 不用 export $(grep | xargs)——token 含空格或特殊字符时会崩

load_env_file() {
  local file="$1"
  [ -f "$file" ] || return 0
  while IFS= read -r line || [ -n "$line" ]; do
    case "$line" in
      ''|\#*) continue ;;
    esac
    local key="${line%%=*}"
    local value="${line#*=}"
    key="${key#"${key%%[![:space:]]*}"}"
    key="${key%"${key##*[![:space:]]}"}"
    value="${value#"${value%%[![:space:]]*}"}"
    value="${value%"${value##*[![:space:]]}"}"
    [ -n "$key" ] || continue
    export "$key=$value"
  done < "$file"
}
