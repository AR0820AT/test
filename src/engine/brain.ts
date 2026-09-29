import type { CardGroup, CardItem } from '@/types'
import { delay } from '@/utils/format'
import { pickRandom, pickWeighted, pickWeightedIndex, randRange } from './random'
import { joinSegments, stitch, type Segment } from './compose'
import { useCardStore } from '@/stores/useCardStore'
import { useChatStore } from '@/stores/useChatStore'
import { usePresenceStore } from '@/stores/usePresenceStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useUiStore } from '@/stores/useUiStore'

/**
 * 说话风格参数（写死，不暴露到设置里）
 * 目标：像真人随手回消息，而不是机器人念字卡
 */

/** 说完一句后还想接着说的概率（递减，写死）：第 2 句、第 3 句、第 4 句 */
const FOLLOW_UP_CHANCE = [38, 18, 7]
/** 一句里用几张卡拼：越往后越少；实际能拼几张由设置里的「最大拼卡数量」截断 */
const COMBO_SIZE_WEIGHTS = [54, 28, 13, 5, 3, 2]
/** 一次最多说几句，免得刷屏 */
const MAX_LINES = 4
/** 「正在输入」显示多久（写死，不暴露到设置里） */
const TYPING_MIN_SEC = 1.1
const TYPING_MAX_SEC = 3.2
/** 连着说几句时，两句之间的停顿（写死；每次都独立掷，不跟说了几句挂钩） */
const LINE_GAP_MIN_SEC = 0.8
const LINE_GAP_MAX_SEC = 2.6

/** 对方撤回自己消息的概率（写死）：在线 22%，离线 66% */
const RECALL_CHANCE_ONLINE = 22
const RECALL_CHANCE_OFFLINE = 66
/** 撤回只在发出后 10 秒内发生，最早 1.5 秒（太快像手滑） */
const RECALL_WINDOW_SEC = 10
const RECALL_MIN_SEC = 1.5

/** 组装好的一条要发出去的消息：拼卡时带来源分段 */
interface ComposedLine {
  text: string
  segments?: Segment[]
}

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

  /** 一句用几张卡：抽到 1 就是「抽到什么发什么」，2 张以上才拼 */
  private comboSize(): number {
    const max = useSettingsStore().draw.maxCombo
    const limit = Math.max(1, Math.min(max, COMBO_SIZE_WEIGHTS.length))
    return pickWeightedIndex(COMBO_SIZE_WEIGHTS.slice(0, limit)) + 1
  }

  /** 组装一条消息：随机卡数 → 随机抽卡 → 随机顺序拼在一起（拼的多张卡会带来源分段） */
  private composeLine(): ComposedLine[] {
    const size = this.comboSize()

    // 抽到什么发什么：原样输出（多行卡就分多条发）
    if (size === 1) {
      const card = this.draw()
      return card ? card.lines.map((text) => ({ text })) : []
    }

    const cards = this.drawMany(size)
    if (!cards.length) return []
    // 每张卡的每一行都记住来自第几张卡，界面上显示成深浅不同的颜色
    const pieces = cards.flatMap((card, source) =>
      card.lines.map((text) => ({ text, source })),
    )
    const segments = stitch(pieces)
    const text = joinSegments(segments)
    return text ? [{ text, segments }] : []
  }

  /** 说一句（一张卡可能是多行），按「正在输入 → 发出」的节奏送出去 */
  private async sayOnce(): Promise<void> {
    const chat = useChatStore()
    const lines = this.composeLine()
    for (let i = 0; i < lines.length; i += 1) {
      if (i > 0) {
        await delay(Math.max(200, randRange(LINE_GAP_MIN_SEC, LINE_GAP_MAX_SEC) * 1000))
      }
      chat.typing = true
      // 长句子多打一会儿，短词几乎秒回
      const typing =
        randRange(TYPING_MIN_SEC, TYPING_MAX_SEC) + Math.min(1.6, lines[i].length * 0.025)
      await delay(Math.max(300, typing * 1000))
      chat.typing = false
      const sent = chat.send({
        role: 'them',
        text: lines[i].text,
        segments: lines[i].segments,
      })
      this.maybeRecall(sent.id)
    }
  }

  /** 说完之后有可能后悔：按在线状态掷一次，中了就在 10 秒内撤回去 */
  private maybeRecall(messageId: string): void {
    const chance = usePresenceStore().themOnline ? RECALL_CHANCE_ONLINE : RECALL_CHANCE_OFFLINE
    if (Math.random() * 100 >= chance) return
    const ms = randRange(RECALL_MIN_SEC, RECALL_WINDOW_SEC) * 1000
    setTimeout(() => useChatStore().recall(messageId), ms)
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
      // 第一句必说；之后每说完一句，按递减概率独立决定要不要再补一句
      for (let round = 0; round < MAX_LINES; round += 1) {
        if (round > 0) {
          const chance = FOLLOW_UP_CHANCE[round - 1] ?? 0
          if (Math.random() * 100 >= chance) break
          // 两句之间的停顿每次都重新掷一次，跟已经说了几句无关
          await delay(Math.max(200, randRange(LINE_GAP_MIN_SEC, LINE_GAP_MAX_SEC) * 1000))
        }
        await this.sayOnce()
      }
    } finally {
      useChatStore().typing = false
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

  /** 启动主动发消息循环；对方离线时不主动找你 */
  restartProactive(): void {
    if (this.proactiveTimer) clearTimeout(this.proactiveTimer)
    const settings = useSettingsStore()
    if (!settings.proactive.enabled || !usePresenceStore().themOnline) return
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
