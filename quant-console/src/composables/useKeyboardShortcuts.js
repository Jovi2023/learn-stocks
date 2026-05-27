import { onMounted, onUnmounted } from 'vue'

const TAB_BY_KEY = { 1: 'backtest', 2: 'code', 3: 'data', 4: 'analyze' }

/**
 * 全局快捷键（审计 #9）
 * @param {{ onSwitchTab?: (id: string) => void, onEscape?: () => void, isOverlayOpen?: () => boolean }} handlers
 */
export function useKeyboardShortcuts(handlers) {
  function onKeyDown(e) {
    if (e.key === 'Escape') {
      handlers.onEscape?.()
      return
    }

    if (handlers.isOverlayOpen?.()) return

    const tabId = e.altKey && !e.ctrlKey && !e.metaKey && TAB_BY_KEY[e.key]
    if (tabId) {
      e.preventDefault()
      handlers.onSwitchTab?.(tabId)
    }
  }

  onMounted(() => window.addEventListener('keydown', onKeyDown))
  onUnmounted(() => window.removeEventListener('keydown', onKeyDown))
}
