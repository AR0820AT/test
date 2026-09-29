/** 通用小工具：日期格式化、节流、延迟等 */

const pad = (n: number) => String(n).padStart(2, '0')

/** 聊天时间戳：今天只显示时分，昨天显示「昨天」，更早显示日期 */
export function formatTime(ts: number): string {
  const d = new Date(ts)
  const now = new Date()
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

  if (sameDay(d, now)) return `${pad(d.getHours())}:${pad(d.getMinutes())}`
  const yesterday = new Date(now.getTime() - 86400000)
  if (sameDay(d, yesterday)) return `昨天 ${pad(d.getHours())}:${pad(d.getMinutes())}`
  return `${d.getMonth() + 1}月${d.getDate()}日 ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** 是否需要在两条消息之间插入时间分隔（间隔超过 5 分钟） */
export function needTimeDivider(prevTs: number | undefined, ts: number): boolean {
  if (!prevTs) return true
  return ts - prevTs > 5 * 60 * 1000
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** 生成引用摘要 */
export function makeDigest(input: { kind: string; text?: string }): string {
  const map: Record<string, string> = { sticker: '[表情]', image: '[图片]' }
  const base = input.text?.trim() || map[input.kind] || '[消息]'
  const flat = base.replace(/\s+/g, ' ')
  return flat.length > 30 ? `${flat.slice(0, 30)}…` : flat
}
