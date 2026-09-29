/**
 * 全局数据结构定义
 * 新增字段时，只需在这里改动，其余模块会自动获得类型提示。
 */

/** 消息归属：我 / 对方 */
export type Role = 'me' | 'them'

/** 消息种类：文字（含 emoji）/ 自定义表情包 / 图片 */
export type MsgKind = 'text' | 'sticker' | 'image'



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



/** 主题模式 */
export type ThemeMode = 'light' | 'dark' | 'auto'

/** 被引用的消息快照（原文删除后仍可显示摘要） */
export interface QuoteRef {
  messageId: string
  role: Role
  name: string
  digest: string
}

/** 一句里来自不同字卡的片段：只用来显示深浅不同的颜色，不展示来源本身 */
export interface MessageSegment {
  text: string
  /** 第几张卡（同一条消息内递增），决定颜色深浅 */
  source: number
}

export interface Message {
  id: string
  role: Role
  kind: MsgKind
  /** 文字内容（text 类型） */
  text?: string
  /** 拼卡时才会有：来自不同字卡的分段；没有就整句一色 */
  segments?: MessageSegment[]
  /** IndexedDB 中的图片 id（sticker / image 类型） */
  assetId?: string
  quote?: QuoteRef | null
  createdAt: number
  /** 是否已撤回：撤回后气泡区域显示系统提示 */
  recalled?: boolean
}

/** 一方的人物资料（只保留昵称，界面上用名字牌代替头像） */
export interface Profile {
  nickname: string
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
  /** 已读不回的概率（0-100） */
  ignoreChance: number
}

export interface ProactiveSettings {
  enabled: boolean
  /** 主动发字卡的最短间隔（分钟） */
  minIntervalMin: number
  /** 主动发字卡的最长间隔（分钟） */
  maxIntervalMin: number
}

export interface DrawSettings {
  /** 一句里最多用几张卡拼（1 = 抽到什么发什么） */
  maxCombo: number
}

/** 字号档位：小 / 标准 / 大 */
export type FontScale = 'sm' | 'md' | 'lg'

export interface UiSettings {
  theme: ThemeMode
  /** 强调色，直接注入 CSS 变量 */
  accent: string
  animations: boolean
  /** 毛玻璃（背景模糊）效果，关闭后可提升低端机性能 */
  glass: boolean
  /** 正文基准字号档位 */
  fontScale: FontScale
}

export interface Settings {
  reply: ReplySettings
  proactive: ProactiveSettings
  draw: DrawSettings
  ui: UiSettings
}
