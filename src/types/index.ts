/**
 * 全局数据结构定义
 * 新增字段时，只需在这里改动，其余模块会自动获得类型提示。
 */

/** 消息归属：我 / 对方 */
export type Role = 'me' | 'them'

/** 消息种类：文字（含 emoji）/ 自定义表情包 / 图片 */
export type MsgKind = 'text' | 'sticker' | 'image'

/** 抽卡策略 */
export type DrawStrategy = 'random' | 'sequential' | 'shuffle'

/** 字卡语言 */
export type LangCode = 'zh' | 'en'

/** 字卡类别：单词 / 句子 */
export type CardCategory = 'word' | 'sentence'

/** 英文词性（拼句时用来选模板，不展示给用户） */
export type WordPos = 'noun' | 'verb' | 'adj' | 'adv' | 'pron' | 'det' | 'prep' | 'conj' | 'aux' | 'num'

/** 自动分组信息：语言 / 类别 / 首字母 */
export interface CardMeta {
  lang: LangCode
  cat: CardCategory
  letter: string
}

/** 单词卡的输出方式 */
export type WordMode = 'sentence' | 'word'

/** 主题模式 */
export type ThemeMode = 'light' | 'dark' | 'auto'

/** 被引用的消息快照（原文删除后仍可显示摘要） */
export interface QuoteRef {
  messageId: string
  role: Role
  name: string
  digest: string
}

export interface Message {
  id: string
  role: Role
  kind: MsgKind
  /** 文字内容（text 类型） */
  text?: string
  /** IndexedDB 中的图片 id（sticker / image 类型） */
  assetId?: string
  quote?: QuoteRef | null
  createdAt: number
  /** 是否已撤回：撤回后气泡区域显示系统提示 */
  recalled?: boolean
}

/** 一方的人物资料 */
export interface Profile {
  nickname: string
  avatarId: string | null
}

/** 一张字卡：lines 为多连发内容，会逐条发出 */
export interface CardItem {
  id: string
  lines: string[]
}

/** 字卡分组：支持「语言 → 词语/句子 → 首字母」三层结构 */
export interface CardGroup {
  id: string
  name: string
  enabled: boolean
  /** 抽组权重，越大越容易被抽到 */
  weight: number
  cards: CardItem[]
  /** 父分组 id：为空表示顶层（语言）分组 */
  parentId?: string | null
  /** 自动分组时写入的分类信息，父级分组不带 */
  meta?: CardMeta
}

export interface Sticker {
  id: string
  name: string
  createdAt: number
}

export interface ReplySettings {
  enabled: boolean
  /** 收到我方消息后，最短多久回复（秒） */
  minDelaySec: number
  /** 最长多久回复（秒） */
  maxDelaySec: number
  /** 多连发时每条之间的间隔（秒） */
  lineGapSec: number
  /** 每条消息发出前「正在输入」显示时长（秒） */
  typingSec: number
}

export interface ProactiveSettings {
  enabled: boolean
  /** 主动发字卡的最短间隔（分钟） */
  minIntervalMin: number
  /** 主动发字卡的最长间隔（分钟） */
  maxIntervalMin: number
}

export interface DrawSettings {
  strategy: DrawStrategy
  /** 拼卡成句：一次抽多张卡拼成一句话发出 */
  combo: boolean
  /** 触发拼卡成句的概率（0-100） */
  comboChance: number
  /** 抽到单词卡时：sentence＝套进句子里说，word＝原样发单词 */
  wordMode: WordMode
}

export interface UiSettings {
  theme: ThemeMode
  /** 强调色，直接注入 CSS 变量 */
  accent: string
  animations: boolean
  bubbleTail: boolean
  /** 毛玻璃（背景模糊）效果，关闭后可提升低端机性能 */
  glass: boolean
}

export interface Settings {
  /** 总开关：暂停后对方不再自动回复/主动发消息 */
  paused: boolean
  reply: ReplySettings
  proactive: ProactiveSettings
  draw: DrawSettings
  ui: UiSettings
}

/** 备份文件格式 */
export interface BackupFile {
  app: 'card-chat'
  version: number
  createdAt: number
  /** localStorage 的全部键值对 */
  data: Record<string, unknown>
  /** 图片资源：id -> dataURL */
  images: Record<string, string>
}
