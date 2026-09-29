import { ref } from 'vue'
import type { QuoteRef } from '@/types'

/**
 * 当前正在引用的消息（输入栏与长按菜单共享）
 * 不需要持久化，所以用模块级单例即可
 */
const quoting = ref<QuoteRef | null>(null)

export function useQuoting() {
  return {
    quoting,
    set(value: QuoteRef | null) {
      quoting.value = value
    },
    clear() {
      quoting.value = null
    },
  }
}
