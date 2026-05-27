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

  pyodide.globals.set('_run_err', null)
  pyodide.globals.set('_run_out', '')

  const runTask = pyodide.runPythonAsync(`
import sys
from io import StringIO
_buf = StringIO()
_old = sys.stdout
sys.stdout = _buf
_run_err = None
try:
    exec(_user_code, {"__name__": "__main__"})
except Exception as e:
    _run_err = f"{type(e).__name__}: {e}"
finally:
    sys.stdout = _old
_run_out = _buf.getvalue()
`)

  try {
    await Promise.race([
      runTask,
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`运行超时（${RUN_TIMEOUT_MS / 1000}s）`)), RUN_TIMEOUT_MS)
      }),
    ])
  } catch (err) {
    return { error: err?.message || String(err) }
  }

  const runErr = pyodide.globals.get('_run_err')
  const runOut = pyodide.globals.get('_run_out')
  if (runErr != null && runErr !== undefined) {
    return { error: String(runErr) }
  }
  const text = String(runOut ?? '')
  return { output: text || '(无输出)' }
}
