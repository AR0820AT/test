import { ref, watch, type Ref } from 'vue'

/**
 * 轻量持久化：把 ref 自动同步到 localStorage
 * 用法：const settings = usePersisted('settings', () => defaultSettings())
 */

const PREFIX = 'card-chat:'

export function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function saveJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch (error) {
    console.warn('[card-chat] 保存失败：', key, error)
  }
}

export function usePersisted<T>(key: string, fallback: () => T): Ref<T> {
  const state = ref(loadJson(key, fallback())) as Ref<T>
  let timer: ReturnType<typeof setTimeout> | undefined
  watch(
    state,
    (value) => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => saveJson(key, value), 250)
    },
    { deep: true },
  )
  return state
}

/** 取出全部持久化数据（备份用），键名不含前缀 */
export function dumpAll(): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (let i = 0; i < localStorage.length; i += 1) {
    const raw = localStorage.key(i)
    if (!raw || !raw.startsWith(PREFIX)) continue
    try {
      out[raw.slice(PREFIX.length)] = JSON.parse(localStorage.getItem(raw) as string)
    } catch {
      /* 跳过损坏项 */
    }
  }
  return out
}

/** 用备份数据整体覆盖本地（导入用） */
export function replaceAll(data: Record<string, unknown>): void {
  Object.entries(data).forEach(([key, value]) => saveJson(key, value))
}

export function clearPersisted(): void {
  const keys: string[] = []
  for (let i = 0; i < localStorage.length; i += 1) {
    const raw = localStorage.key(i)
    if (raw && raw.startsWith(PREFIX)) keys.push(raw)
  }
  keys.forEach((key) => localStorage.removeItem(key))
}

/** 估算占用体积（字符数近似字节） */
export function estimateSize(): number {
  let total = 0
  for (let i = 0; i < localStorage.length; i += 1) {
    const raw = localStorage.key(i)
    if (!raw || !raw.startsWith(PREFIX)) continue
    total += (localStorage.getItem(raw) || '').length
  }
  return total
}

/** 把对象与默认值做浅层合并，保证升级后新增字段也有默认值 */
export function withDefaults<T extends Record<string, unknown>>(raw: Partial<T> | null, defaults: T): T {
  if (!raw || typeof raw !== 'object') return { ...defaults }
  const out: Record<string, unknown> = { ...defaults }
  Object.entries(raw).forEach(([key, value]) => {
    if (value === undefined) return
    const base = out[key]
    if (base && typeof base === 'object' && !Array.isArray(base) && value && typeof value === 'object' && !Array.isArray(value)) {
      out[key] = { ...(base as Record<string, unknown>), ...(value as Record<string, unknown>) }
    } else {
      out[key] = value
    }
  })
  return out as T
}
