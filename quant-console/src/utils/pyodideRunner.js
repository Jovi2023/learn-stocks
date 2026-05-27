// Pyodide 懒加载（CDN），仅在用户点击「▶ 运行」时拉取 ~15MB

const PYODIDE_VER = '0.26.4'
const PYODIDE_BASE = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VER}/full/`
const RUN_TIMEOUT_MS = 30_000
const MAX_CODE_LEN = 32_000

let pyodideReady = null

export function loadPyodideRuntime() {
  if (!pyodideReady) {
    pyodideReady = (async () => {
      const { loadPyodide } = await import(/* @vite-ignore */ `${PYODIDE_BASE}pyodide.mjs`)
      return loadPyodide({ indexURL: PYODIDE_BASE })
    })()
  }
  return pyodideReady
}

/**
 * @param {string} code
 * @returns {Promise<{ output?: string, error?: string }>}
 */
export async function runPythonCode(code) {
  const src = String(code || '').trim()
  if (!src) return { error: '代码为空' }
  if (src.length > MAX_CODE_LEN) {
    return { error: `代码过长（限 ${MAX_CODE_LEN} 字符）` }
  }

  const pyodide = await loadPyodideRuntime()
  pyodide.globals.set('_user_code', src)

  const runTask = pyodide.runPythonAsync(`
import sys
from io import StringIO
_buf = StringIO()
_old = sys.stdout
sys.stdout = _buf
_err = None
try:
    exec(_user_code, {"__name__": "__main__"})
except Exception as e:
    _err = f"{type(e).__name__}: {e}"
finally:
    sys.stdout = _old
if _err:
    _err
else:
    _buf.getvalue()
`)

  let result
  try {
    result = await Promise.race([
      runTask,
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`运行超时（${RUN_TIMEOUT_MS / 1000}s）`)), RUN_TIMEOUT_MS)
      }),
    ])
  } catch (err) {
    return { error: err?.message || String(err) }
  }

  const text = String(result ?? '')
  if (text.startsWith('Error:') || text.includes('Exception:') || /^\\w+Error:/.test(text)) {
    return { error: text }
  }
  return { output: text || '(无输出)' }
}
