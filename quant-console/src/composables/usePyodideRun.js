import { runPythonCode } from '../utils/pyodideRunner.js'

export function usePyodideRun() {
  async function handleRunClick(e) {
    const btn = e.target.closest?.('.code-run-btn')
    if (!btn || btn.disabled) return

    const wrap = btn.closest('.code-block-wrap')
    const code = wrap?.querySelector('pre code')?.textContent ?? ''
    const outEl = wrap?.querySelector('.code-run-output')
    if (!outEl) return

    const label = btn.querySelector('.code-run-label')
    const prev = label?.textContent ?? '▶'

    btn.disabled = true
    outEl.hidden = false
    outEl.classList.remove('code-run-error')
    outEl.textContent = '加载 Python 运行环境…'
    if (label) label.textContent = '⏳'

    try {
      const { output, error } = await runPythonCode(code)
      if (error) {
        outEl.textContent = error
        outEl.classList.add('code-run-error')
      } else {
        outEl.textContent = output
      }
    } catch (err) {
      outEl.textContent = err?.message || String(err)
      outEl.classList.add('code-run-error')
    } finally {
      btn.disabled = false
      if (label) label.textContent = prev
    }
  }

  return { handleRunClick }
}
