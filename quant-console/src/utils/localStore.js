// 浏览器内对话存档 - IndexedDB 经 idb-keyval 极薄封装
// 数据只存当前浏览器配置里，换浏览器 / 隐身模式 / 清缓存都会丢，主打隐私不主打可靠

import { createStore, set, get, del, entries } from 'idb-keyval'

const store = createStore('quant-console', 'chats')

function newId() {
  return `chat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export async function saveLocalChat(title, messages) {
  const item = {
    id: newId(),
    title,
    created: new Date().toISOString(),
    messages,
  }
  await set(item.id, item, store)
  return item
}

export async function getLocalChat(id) {
  return get(id, store)
}

export async function listLocalChats() {
  const all = await entries(store)
  return all
    .map(([, v]) => v)
    .sort((a, b) => (a.created < b.created ? 1 : -1))
}

export async function deleteLocalChat(id) {
  await del(id, store)
}
