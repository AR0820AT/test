import type { CardGroup, CardItem } from '@/types'
import { delay } from '@/utils/format'
import { pickRandom, pickWeighted, randRange, ShuffleBag } from './random'
import { composeSentence, soloSentence } from './compose'
import { useCardStore } from '@/stores/useCardStore'
import { useChatStore } from '@/stores/useChatStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useUiStore } from '@/stores/useUiStore'
import { isEnglishWord } from '@/utils/text'

/** 拼卡成句一次抽几张 */
const COMBO_SIZE = 3

/**
 * 抽字卡引擎：负责「什么时候发」「发哪张」
 * 支持单次抽一张，也支持一次抽多张拼成一句话
 */
class ChatBrain {
  private replyTimer: ReturnType<typeof setTimeout> | undefined
  private proactiveTimer: ReturnType<typeof setTimeout> | undefined
  private bags = new Map<string, ShuffleBag<CardItem>>()
  private seqIndex = new Map<string, number>()
  private speaking = false

  /** 从指定分组池里抽一张卡：先按权重选分组，再按策略选卡 */
  private drawFrom(pools: CardGroup[]): CardItem | undefined {
    const settings = useSettingsStore()
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

  private draw(): CardItem | undefined {
    return this.drawFrom(useCardStore().enabledGroups)
  }

  /** 一次抽多张互不相同的卡，优先从「词语」分组抽 */
  private drawMany(count: number): CardItem[] {
    const cardStore = useCardStore()
    const wordPools = cardStore.wordGroups
    const pools = wordPools.length ? wordPools : cardStore.enabledGroups
    const picked: CardItem[] = []
    for (let attempt = 0; attempt < count * 8 && picked.length < count; attempt += 1) {
      const card = this.drawFrom(pools)
      if (card && !picked.includes(card)) picked.push(card)
    }
    return picked
  }

  /** 把一段文字按「正在输入 → 发出」的节奏送出去 */
  private async say(lines: string[]): Promise<void> {
    const chat = useChatStore()
    const settings = useSettingsStore()
    const rule = settings.reply
    try {
      for (let i = 0; i < lines.length; i += 1) {
        if (i > 0) {
          await delay(Math.max(0, (rule.lineGapSec + randRange(-0.3, 0.6)) * 1000))
        }
        chat.typing = true
        await delay(Math.max(200, rule.typingSec * 1000 * randRange(0.7, 1.2)))
        chat.typing = false
        chat.send({ role: 'them', text: lines[i] })
      }
    } finally {
      chat.typing = false
    }
  }

  /** 抽一张卡（或几张拼成一句）并发出来 */
  async speak(): Promise<void> {
    if (this.speaking) return
    const settings = useSettingsStore()
    const ui = useUiStore()

    if (!useCardStore().enabledGroups.length) {
      ui.toast('字卡库是空的，先去「字卡库」添加几张')
      return
    }

    this.speaking = true
    try {
      // 拼卡成句：一次抽三张，塞进同一个句子里
      if (settings.draw.combo && Math.random() * 100 < settings.draw.comboChance) {
        const cards = this.drawMany(COMBO_SIZE)
        const sentence = composeSentence(cards)
        if (sentence) {
          await this.say([sentence])
          return
        }
      }

      const card = this.draw()
      if (!card) return

      // 单词卡可以套进一句英文里再说出来
      const single = card.lines.length === 1 && isEnglishWord(card.lines[0])
      const lines = single && settings.draw.wordMode === 'sentence' ? [soloSentence(card)] : card.lines
      await this.say(lines)
    } finally {
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

  /** 立刻发一张 */
  drawNow(): Promise<void> {
    return this.speak()
  }
}

export const brain = new ChatBrain()
