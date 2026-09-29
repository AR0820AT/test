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

/** 洗牌：返回一个新数组，原数组不变 */
export function shuffle<T>(list: readonly T[]): T[] {
  const out = [...list]
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/** 按权重抽一个下标，权重数组总和任意 */
export function pickWeightedIndex(weights: readonly number[]): number {
  const total = weights.reduce((sum, item) => sum + Math.max(0, item), 0)
  if (total <= 0) return 0
  let roll = Math.random() * total
  for (let i = 0; i < weights.length; i += 1) {
    roll -= Math.max(0, weights[i])
    if (roll <= 0) return i
  }
  return weights.length - 1
}
