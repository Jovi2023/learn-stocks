// 聊天区代码块「📋 复制」——事件委托，配合 markdown.js 输出的 .code-copy-btn

const COPIED_MS = 2000

export function useCodeCopy() {
  async function handleMessagesClick(e) {
    const btn = e.target.closest?.('.code-copy-btn')
    if (!btn) return

    const wrap = btn.closest('.code-block-wrap')
    const code = wrap?.querySelector('pre code')
    const text = code?.textContent ?? ''
    if (!text) return

    const label = btn.querySelector('.code-copy-label')
    const prev = label?.textContent ?? btn.textContent

    try {
      await navigator.clipboard.writeText(text)
      if (label) label.textContent = '已复制'
      else btn.textContent = '已复制'
      btn.classList.add('copied')
      setTimeout(() => {
        if (label) label.textContent = prev
        else btn.textContent = prev
        btn.classList.remove('copied')
      }, COPIED_MS)
    } catch (err) {
      btn.title = `复制失败：${err.message}`
      setTimeout(() => { btn.title = '复制代码' }, COPIED_MS)
    }
  }

  return { handleMessagesClick }
}
