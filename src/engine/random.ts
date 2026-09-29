/** 随机数与抽取策略 */

export function randInt(min: number, max: number): number {
  const lo = Math.ceil(Math.min(min, max))
  const hi = Math.floor(Math.max(min, max))
  return lo + Math.floor(Math.random() * (hi - lo + 1))
}

export function randRange(min: number, max: number): number {
  const lo = Math.min(min, max)
  const hi = Math.max(min, max)
  return lo + Math.random() * (hi - lo)
}

export function pickRandom<T>(list: readonly T[]): T | undefined {
  if (!list.length) return undefined
  return list[Math.floor(Math.random() * list.length)]
}

/** 按权重抽取 */
export function pickWeighted<T>(list: readonly T[], weightOf: (item: T) => number): T | undefined {
  const usable = list.filter((item) => weightOf(item) > 0)
  if (!usable.length) return undefined
  const total = usable.reduce((sum, item) => sum + weightOf(item), 0)
  let roll = Math.random() * total
  for (const item of usable) {
    roll -= weightOf(item)
    if (roll <= 0) return item
  }
  return usable[usable.length - 1]
}

/**
 * 洗牌袋：一轮内每张卡都会出现一次，且不会连续抽到同一张
 * 用于「不重复」抽取策略，避免短时间内连续抽到同一张卡
 */
export class ShuffleBag<T> {
  private remaining: T[] = []
  private last: T | undefined

  constructor(private source: () => T[]) {}

  draw(): T | undefined {
    const source = this.source()
    if (!source.length) return undefined
    if (!this.remaining.length) {
      if (source.length === 1) {
        this.remaining = [...source]
      } else {
        // 重新洗牌：除上一张外先入袋，上一张放到最后一轮位置，保证全覆盖且不连抽
        const others = source.filter((item) => item !== this.last)
        this.remaining = others
        if (this.last !== undefined) this.remaining.push(this.last)
      }
    }
    const index = Math.floor(Math.random() * this.remaining.length)
    const value = this.remaining.splice(index, 1)[0]
    this.last = value
    return value
  }
}
