import { computed } from 'vue'
import { defineStore } from 'pinia'
import { usePersisted } from '@/storage/persist'

/** 对方在线状态多久重新判定一次 */
export const PRESENCE_CHECK_MS = 5 * 60 * 1000
/** 对方在线的概率（写死，不暴露到设置里） */
export const ONLINE_CHANCE = 66

interface PresenceState {
  /** 对方是否在线（每次判定后存下来，刷新页面不会被重置） */
  themOnline: boolean
  /** 上次判定的时间戳 */
  checkedAt: number
}

function defaults(): PresenceState {
  return { themOnline: true, checkedAt: 0 }
}

/**
 * 对方在线状态：按固定概率掷一次，每 5 分钟重新判定
 * 只显示对方的状态（我这边不做在线判断）
 */
export const usePresenceStore = defineStore('presence', () => {
  const state = usePersisted<PresenceState>('presence', defaults)

  const themOnline = computed(() => state.value.themOnline)

  let timer: ReturnType<typeof setInterval> | undefined
  let started = false

  /** 按概率重新判定对方是否在线 */
  function reroll(): void {
    state.value.themOnline = Math.random() * 100 < ONLINE_CHANCE
    state.value.checkedAt = Date.now()
  }

  function start(): void {
    if (started) return
    started = true

    // 距离上次判定已超过一个周期（或第一次打开）就立刻重新掷一次
    if (Date.now() - state.value.checkedAt >= PRESENCE_CHECK_MS) reroll()

    timer = setInterval(reroll, PRESENCE_CHECK_MS)
  }

  return { themOnline, reroll, start }
})
