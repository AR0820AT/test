import { computed } from 'vue'
import { defineStore } from 'pinia'
import { usePersisted } from '@/storage/persist'

/** 进入应用的固定口令（想改就改这里，长度需为 4） */
export const PASSCODE = '8888'

interface LockState {
  unlocked: boolean
  unlockedAt: number
}

/**
 * 锁屏状态：只记录「是否已解锁」，解锁状态存在本机，刷新后无需重输
 * 注意：这是纯前端的遮挡，用来防止旁人顺手点开，不是加密保护
 */
export const useLockStore = defineStore('lock', () => {
  const state = usePersisted<LockState>('lock', () => ({ unlocked: false, unlockedAt: 0 }))

  const unlocked = computed(() => state.value.unlocked)

  function tryUnlock(code: string): boolean {
    if (code !== PASSCODE) return false
    state.value = { unlocked: true, unlockedAt: Date.now() }
    return true
  }

  function lock(): void {
    state.value = { unlocked: false, unlockedAt: 0 }
  }

  return { unlocked, tryUnlock, lock }
})
