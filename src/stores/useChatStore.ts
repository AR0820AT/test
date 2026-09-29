import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { CardGroup, CardItem, Message, MessageSegment, QuoteRef, Role, Sticker } from '@/types'
import { makeDigest } from '@/utils/format'
import { uid } from '@/utils/id'
import { usePersisted } from '@/storage/persist'
import { useProfileStore } from './useProfileStore'

/**
 * 聊天消息仓库
 * 所有写操作都在这里完成，UI 与抽卡引擎共用同一套方法
 */
export const useChatStore = defineStore('chat', () => {
  const messages = usePersisted<Message[]>('messages', () => [])
  /** 对方是否正在输入（不持久化） */
  const typing = ref(false)

  const lastMessage = () => (messages.value.length ? messages.value[messages.value.length - 1] : undefined)

  function push(message: Message): Message {
    messages.value.push(message)
    return message
  }

  function createMessage(input: {
    role: Role
    text?: string
    assetId?: string
    kind?: Message['kind']
    quote?: QuoteRef | null
    segments?: MessageSegment[]
  }): Message {
    const kind = input.kind ?? (input.assetId ? 'image' : 'text')
    return {
      id: uid('m_'),
      role: input.role,
      kind,
      text: input.text,
      assetId: input.assetId,
      quote: input.quote ?? null,
      segments: input.segments?.length ? input.segments : undefined,
      createdAt: Date.now(),
    }
  }

  function send(input: {
    role: Role
    text?: string
    assetId?: string
    kind?: Message['kind']
    quote?: QuoteRef | null
    segments?: MessageSegment[]
  }): Message {
    return push(createMessage(input))
  }

  /** 生成引用快照 */
  function quoteRefOf(id: string): QuoteRef | null {
    const target = messages.value.find((item) => item.id === id)
    if (!target) return null
    if (target.recalled) return null
    const profile = useProfileStore()
    return {
      messageId: target.id,
      role: target.role,
      name: profile.nameOf(target.role),
      digest: makeDigest({ kind: target.kind, text: target.text }),
    }
  }

  function remove(id: string): void {
    messages.value = messages.value.filter((item) => item.id !== id)
  }

  /** 撤回：保留记录，显示系统提示 */
  function recall(id: string): void {
    const target = messages.value.find((item) => item.id === id)
    if (target) target.recalled = true
  }

  function clear(): void {
    messages.value = []
  }

  return { messages, typing, lastMessage, push, createMessage, send, quoteRefOf, remove, recall, clear }
})

export type ChatStore = ReturnType<typeof useChatStore>

/** 卡片/表情类型仅做类型复用导出 */
export type { CardGroup, CardItem, Sticker }
