import { randInt, shuffle } from './random'

/**
 * 拼卡：把抽到的几段文本随机打乱后拼在一起
 * 拼法也随机 —— 追加在后面 / 放到前面 / 插进上一句中间
 * 插的时候只在「能断句的地方」下刀（空格、标点、中英文交界），
 * 不会把一个英文单词或中文词语从中间劈开
 * 拼出来的句子不追求语法正确，要的就是真人随手拼的那种味道
 */

/** 少数时候插入的位置靠前一点，读起来更像「脱口而出」 */
const INSERT_WEIGHT = 0.5
const PREPEND_WEIGHT = 0.16

/** 一句里来自同一张卡的片段：source 用来显示深浅不同的颜色 */
export interface Segment {
  text: string
  source: number
}

/** 这些标点后面可以断句 */
const BREAK_AFTER = new Set([
  ',',
  '.',
  '!',
  '?',
  ';',
  ':',
  '，',
  '。',
  '！',
  '？',
  '；',
  '：',
  '、',
  '…',
  '—',
  '~',
  '·',
  ')',
  '）',
  ']',
  '】',
  '》',
  '"',
  '"',
  "'",
  '』',
  '」',
])

function isCjk(char: string): boolean {
  return /[\u2e80-\u9fff\uff00-\uffef]/.test(char)
}

/** 可以下刀的位置：单词之间（空格）、标点之后、中英文交界 */
function cutPoints(text: string): number[] {
  const chars = Array.from(text)
  const points: number[] = []
  for (let i = 1; i < chars.length; i += 1) {
    const prev = chars[i - 1]
    const next = chars[i]
    // 别切出以空格开头的右半，也别切在末尾（那样等于没插）
    if (next === ' ') continue
    if (prev === ' ') points.push(i)
    else if (BREAK_AFTER.has(prev)) points.push(i)
    else if (isCjk(prev) !== isCjk(next)) points.push(i)
  }
  return points
}

/** 两段之间要不要补空格 */
function needsSpace(left: string, right: string): boolean {
  if (!left || !right) return false
  if (/[\s，,、；;：:]$/.test(left)) return false
  if (/^[，,、；;：:.!?！？]/.test(right)) return false
  return true
}

/** 插到中间：只能在断句处下刀；实在没地方插就返回 false（调用方改成追加） */
function insertInside(segments: Segment[], piece: Segment): boolean {
  const spots: { seg: number; at: number }[] = []
  segments.forEach((segment, index) => {
    cutPoints(segment.text).forEach((at) => spots.push({ seg: index, at }))
  })
  if (!spots.length) return false

  const spot = spots[randInt(0, spots.length - 1)]
  const target = segments[spot.seg]
  const chars = Array.from(target.text)
  const left = chars.slice(0, spot.at).join('')
  const right = chars.slice(spot.at).join('')
  // 切开后要补空格，不然两个词会粘在一起
  const leftPart = needsSpace(left, piece.text) ? `${left} ` : left
  const midPart = needsSpace(piece.text, right) ? `${piece.text} ` : piece.text
  // 被切开的两半还算同一张卡，颜色保持一致
  segments.splice(
    spot.seg,
    1,
    { text: leftPart, source: target.source },
    { text: midPart, source: piece.source },
    { text: right, source: target.source },
  )
  return true
}

/** 收尾：压缩多余空格、去掉首尾空白、英文首字母大写 */
function tidy(segments: Segment[]): Segment[] {
  const out = segments
    .map((segment) => ({ ...segment, text: segment.text.replace(/\s{2,}/g, ' ') }))
    .filter((segment) => segment.text)

  const first = out[0]
  if (first) {
    first.text = first.text.replace(/^\s+/, '')
    const chars = Array.from(first.text)
    if (chars.length && /[a-z]/.test(chars[0])) {
      first.text = chars[0].toUpperCase() + chars.slice(1).join('')
    }
  }
  const last = out[out.length - 1]
  if (last) last.text = last.text.replace(/\s+$/, '')

  return out
}

/** 把若干段文本随机拼成一段，返回带来源的片段（拼出来的完整句子 = 各段 text 相连） */
export function stitch(pieces: Segment[]): Segment[] {
  const list = shuffle(
    pieces
      .map((piece) => ({ text: piece.text.trim(), source: piece.source }))
      .filter((piece) => piece.text),
  )
  if (!list.length) return []

  const segments: Segment[] = [{ ...list[0] }]
  for (let i = 1; i < list.length; i += 1) {
    const piece = { ...list[i] }
    const roll = Math.random()
    if (roll < PREPEND_WEIGHT) {
      if (needsSpace(piece.text, segments[0].text)) piece.text += ' '
      segments.unshift(piece)
    } else if (roll < INSERT_WEIGHT && insertInside(segments, piece)) {
      // 已经插进去了
    } else {
      const last = segments[segments.length - 1]
      if (needsSpace(last.text, piece.text)) last.text += ' '
      segments.push(piece)
    }
  }
  return tidy(segments)
}

/** 片段拼回整句 */
export function joinSegments(segments: Segment[]): string {
  return segments.map((segment) => segment.text).join('')
}
