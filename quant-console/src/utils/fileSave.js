// 对话存档到用户硬盘（JSON 文件）
// 优先 File System Access API（可选保存路径）；否则触发浏览器下载到「下载」文件夹

const CHAT_FILE_VERSION = 1

function sanitizeFilename(title) {
  const base = String(title || '量化对话')
    .trim()
    .slice(0, 80)
    .replace(/[/\\?%*:|"<>]/g, '_')
  return `${base || '量化对话'}.json`
}

function buildPayload(title, messages) {
  return {
    version: CHAT_FILE_VERSION,
    title,
    saved: new Date().toISOString(),
    messages,
  }
}

/** @returns {{ title: string, messages: Array<{role:string,content:string}> } | null} */
export function parseChatFileJson(text, fallbackTitle = '') {
  const data = JSON.parse(text)
  if (Array.isArray(data)) {
    return { title: fallbackTitle || '导入的对话', messages: data }
  }
  if (data && Array.isArray(data.messages)) {
    return {
      title: String(data.title || fallbackTitle || '导入的对话'),
      messages: data.messages,
    }
  }
  throw new Error('不是有效的对话存档 JSON（需包含 messages 数组）')
}

/**
 * 保存到硬盘：Chrome/Edge 可弹出「另存为」选路径；其他浏览器下载到默认下载目录
 * @returns {{ filename: string, method: 'picker' | 'download' }}
 */
export async function saveChatToDisk(title, messages) {
  const filename = sanitizeFilename(title)
  const json = JSON.stringify(buildPayload(title, messages), null, 2)

  if (typeof window.showSaveFilePicker === 'function') {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: filename,
        types: [
          {
            description: '量化对话存档',
            accept: { 'application/json': ['.json'] },
          },
        ],
      })
      const writable = await handle.createWritable()
      await writable.write(json)
      await writable.close()
      return { filename: handle.name || filename, method: 'picker' }
    } catch (err) {
      if (err?.name === 'AbortError') throw new Error('已取消保存')
      throw err
    }
  }

  const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
  return { filename, method: 'download' }
}

/** 从硬盘打开 JSON 存档；用户取消时返回 null */
export async function openChatFromDisk() {
  if (typeof window.showOpenFilePicker === 'function') {
    try {
      const [handle] = await window.showOpenFilePicker({
        multiple: false,
        types: [
          {
            description: '量化对话存档',
            accept: { 'application/json': ['.json'] },
          },
        ],
      })
      const file = await handle.getFile()
      const parsed = parseChatFileJson(await file.text(), file.name.replace(/\.json$/i, ''))
      return { ...parsed, filename: file.name }
    } catch (err) {
      if (err?.name === 'AbortError') return null
      throw err
    }
  }

  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,application/json'
    input.style.display = 'none'
    input.addEventListener('change', async () => {
      const file = input.files?.[0]
      input.remove()
      if (!file) {
        resolve(null)
        return
      }
      try {
        const parsed = parseChatFileJson(await file.text(), file.name.replace(/\.json$/i, ''))
        resolve({ ...parsed, filename: file.name })
      } catch (e) {
        reject(e)
      }
    })
    document.body.appendChild(input)
    input.click()
  })
}
