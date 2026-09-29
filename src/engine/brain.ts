import type { CardItem } from '@/types'
import { delay } from '@/utils/format'
import { pickRandom, pickWeighted, randRange, ShuffleBag } from './random'
import { useCardStore } from '@/stores/useCardStore'
import { useChatStore } from '@/stores/useChatStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useUiStore } from '@/stores/useUiStore'

/**
 * 抽字卡引擎：负责「什么时候发」「发哪张」
 * UI 与后台逻辑在这里分离，方便以后替换抽取规则
 */
class ChatBrain {
  private replyTimer: ReturnType<typeof setTimeout> | undefined
  private proactiveTimer: ReturnType<typeof setTimeout> | undefined
  private bags = new Map<string, ShuffleBag<CardItem>>()
  private seqIndex = new Map<string, number>()
  private speaking = false

  /** 抽一张卡：先按权重选分组，再按策略选卡 */
  private draw(): CardItem | undefined {
    const cardStore = useCardStore()
    const settings = useSettingsStore()
    const pools = cardStore.enabledGroups
    if (!pools.length) return undefined

    const group = pickWeighted(pools, (item) => item.weight) ?? pools[0]
    const list = group?.cards ?? []
    if (!list.length) return undefined

    if (settings.draw.strategy === 'random') return pickRandom(list)

    if (settings.draw.strategy === 'sequential') {
      const next = (this.seqIndex.get(group.id) ?? -1) + 1
      this.seqIndex.set(group.id, next)
      return list[next % list.length]
    }

    let bag = this.bags.get(group.id)
    if (!bag) {
      bag = new ShuffleBag(() => useCardStore().findGroup(group.id)?.cards ?? [])
      this.bags.set(group.id, bag)
    }
    return bag.draw()
  }

  /** 把一张卡的所有行依次发出 */
  async speak(): Promise<void> {
    if (this.speaking) return
    const chat = useChatStore()
    const settings = useSettingsStore()
    const ui = useUiStore()

    const card = this.draw()
    if (!card) {
      ui.toast('字卡库是空的，先去「字卡库」添加几张')
      return
    }

    this.speaking = true
    const rule = settings.reply
    try {
      for (let i = 0; i < card.lines.length; i += 1) {
        if (i > 0) {
          await delay(Math.max(0, (rule.lineGapSec + randRange(-0.3, 0.6)) * 1000))
        }
        chat.typing = true
        await delay(Math.max(200, rule.typingSec * 1000 * randRange(0.7, 1.2)))
        chat.typing = false
        chat.send({ role: 'them', text: card.lines[i] })
      }
    } finally {
      chat.typing = false
      this.speaking = false
    }
  }

  /** 我发了消息：安排一次延迟回复 */
  notifyUserSent(): void {
    const settings = useSettingsStore()
    if (settings.settings.paused || !settings.reply.enabled) return
    if (this.speaking) return
    if (this.replyTimer) clearTimeout(this.replyTimer)
    const ms = randRange(settings.reply.minDelaySec, settings.reply.maxDelaySec) * 1000
    this.replyTimer = setTimeout(() => {
      void this.speak()
    }, Math.max(200, ms))
  }

  /** 启动主动发消息循环 */
  restartProactive(): void {
    if (this.proactiveTimer) clearTimeout(this.proactiveTimer)
    const settings = useSettingsStore()
    if (settings.settings.paused || !settings.proactive.enabled) return
    const minutes = randRange(settings.proactive.minIntervalMin, settings.proactive.maxIntervalMin)
    const ms = Math.max(10_000, minutes * 60_000)
    this.proactiveTimer = setTimeout(() => {
      void this.speak().finally(() => this.restartProactive())
    }, ms)
  }

  /** 页面加载时调用 */
  start(): void {
    this.restartProactive()
  }

  /** 立刻发一张（ manuual trigger） */
  drawNow(): Promise<void> {
    return this.speak()
  }
}

export const brain = new ChatBrain()
