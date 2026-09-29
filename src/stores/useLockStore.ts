import { ref } from 'vue'
import { defineStore } from 'pinia'

/** 进入应用的固定口令（想改就改这里，长度需为 4） */
export const PASSCODE = '8888'

const LEGACY_KEY = 'card-chat:lock'

/**
 * 旧版本把「已解锁」存在本机，导致刷新后不用再输密码：清掉这条记录，
 * 并刷新一次页面，让「每次进入都要输密码」立刻生效（只刷一次，不会反复刷新）
 */
function dropLegacyUnlock(): void {
  try {
    if (localStorage.getItem(LEGACY_KEY) === null) return
    localStorage.removeItem(LEGACY_KEY)
    if (sessionStorage.getItem('card-chat:lock-reset')) return
    sessionStorage.setItem('card-chat:lock-reset', '1')
    location.reload()
  } catch {
    // 隐私模式下可能拿不到存储，忽略即可
  }
}

dropLegacyUnlock()

/**
 * 锁屏状态：只存在内存里 —— 刷新、重开页面都要重新输一次密码
 * 注意：这是纯前端的遮挡，用来防止旁人顺手点开，不是加密保护
 */
export const useLockStore = defineStore('lock', () => {
  const unlocked = ref(false)

  function tryUnlock(code: string): boolean {
    if (code !== PASSCODE) return false
    unlocked.value = true
    return true
  }

  function lock(): void {
    unlocked.value = false
  }

  return { unlocked, tryUnlock, lock }
})
