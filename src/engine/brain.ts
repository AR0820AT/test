import type { CardGroup, CardItem } from '@/types'
import { delay } from '@/utils/format'
import { pickRandom, pickWeighted, pickWeightedIndex, randRange } from './random'
import { stitch } from './compose'
import { useCardStore } from '@/stores/useCardStore'
import { useChatStore } from '@/stores/useChatStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useUiStore } from '@/stores/useUiStore'

/**
 * 说话风格参数（写死，不暴露到设置里）
 * 目标：像真人随手回消息，而不是机器人念字卡
 */

/** 一次说几句：多数时候只说一句，偶尔连着说两三句 */
const BURST_WEIGHTS = [72, 20, 8]
/** 一句里用几张卡拼：抽到 1 就是「抽到什么发什么」，2 张以上才拼 */
const COMBO_SIZE_WEIGHTS = [54, 28, 13, 5]
/** 一次最多连发几条，免得刷屏 */
const MAX_LINES = 4

/**
 * 抽字卡引擎：负责「什么时候发」「发什么」
 * 抽卡恒为纯随机；拼句时随机卡数、随机抽卡、随机顺序拼，还会把词插进句子中间
 */
class ChatBrain {
  private replyTimer: ReturnType<typeof setTimeout> | undefined
  private proactiveTimer: ReturnType<typeof setTimeout> | undefined
  private speaking = false

  /** 从分组池里随机抽一张：先按权重选分组，再在组内随机 */
  private drawFrom(pools: CardGroup[]): CardItem | undefined {
    if (!pools.length) return undefined
    const group = pickWeighted(pools, (item) => item.weight) ?? pools[0]
    const list = group?.cards ?? []
    return list.length ? pickRandom(list) : undefined
  }

  private draw(): CardItem | undefined {
    return this.drawFrom(useCardStore().enabledGroups)
  }

  /** 一次抽多张互不相同的卡 */
  private drawMany(count: number): CardItem[] {
    const pools = useCardStore().enabledGroups
    const picked: CardItem[] = []
    for (let attempt = 0; attempt < count * 8 && picked.length < count; attempt += 1) {
      const card = this.drawFrom(pools)
      if (card && !picked.some((item) => item.id === card.id)) picked.push(card)
    }
    return picked
  }

  /** 组装一条消息：随机卡数 → 随机抽卡 → 随机顺序拼在一起 */
  private composeLine(): string[] {
    const settings = useSettingsStore()
    const size = settings.draw.combo ? pickWeightedIndex(COMBO_SIZE_WEIGHTS) + 1 : 1

    // 抽到什么发什么：原样输出（多行卡就分多条发）
    if (size === 1) {
      const card = this.draw()
      return card ? card.lines : []
    }

    const cards = this.drawMany(size)
    if (!cards.length) return []
    const text = stitch(cards.flatMap((card) => card.lines))
    return text ? [text] : []
  }

  /** 把一段文字按「正在输入 → 发出」的节奏送出去，时长随机 */
  private async say(lines: string[]): Promise<void> {
    const chat = useChatStore()
    const rule = useSettingsStore().reply
    try {
      for (let i = 0; i < lines.length; i += 1) {
        if (i > 0) {
          await delay(Math.max(200, randRange(rule.lineGapMinSec, rule.lineGapMaxSec) * 1000))
        }
        chat.typing = true
        // 长句子多打一会儿，短词几乎秒回
        const typing = randRange(rule.typingMinSec, rule.typingMaxSec) + Math.min(1.6, lines[i].length * 0.025)
        await delay(Math.max(300, typing * 1000))
        chat.typing = false
        chat.send({ role: 'them', text: lines[i] })
      }
    } finally {
      chat.typing = false
    }
  }

  /** 说一次话：可能是一句，也可能是连着几句 */
  async speak(): Promise<void> {
    if (this.speaking) return
    const ui = useUiStore()

    if (!useCardStore().enabledGroups.length) {
      ui.toast('字卡库是空的，先去「字卡库」添加几张')
      return
    }

    this.speaking = true
    try {
      const bursts = pickWeightedIndex(BURST_WEIGHTS) + 1
      const lines: string[] = []
      for (let i = 0; i < bursts && lines.length < MAX_LINES; i += 1) {
        lines.push(...this.composeLine())
      }
      if (lines.length) await this.say(lines.slice(0, MAX_LINES))
    } finally {
      this.speaking = false
    }
  }

  /** 我发了消息：先掷一次「已读不回」，再安排延迟回复 */
  notifyUserSent(): void {
    const settings = useSettingsStore()
    if (!settings.reply.enabled) return
    if (this.speaking) return
    if (Math.random() * 100 < settings.reply.ignoreChance) return

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
    if (!settings.proactive.enabled) return
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

  /** 立刻说一句 */
  drawNow(): Promise<void> {
    return this.speak()
  }
}

export const brain = new ChatBrain()
