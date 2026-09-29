import { randInt, shuffle } from './random'

/**
 * 拼卡：把抽到的几段文本随机打乱后拼在一起
 * 拼法也随机 —— 追加在后面 / 放到前面 / 直接插进上一句中间
 * 拼出来的句子不追求语法正确，要的就是真人随手拼的那种味道
 */

/** 少数时候插入的位置靠前一点，读起来更像「脱口而出」 */
const INSERT_WEIGHT = 0.5
const PREPEND_WEIGHT = 0.16

function joinText(left: string, right: string): string {
  const a = left.trim()
  const b = right.trim()
  if (!a) return b
  if (!b) return a
  // 已经带分隔符就不再补空格
  if (/[\s，,、；;：:]$/.test(a) || /^[，,、；;：:.!?！？]/.test(b)) return a + b
  return `${a} ${b}`
}

/** 插到中间：英文按空格分词，中文按字插，太短就直接追加 */
function insertInside(base: string, piece: string): string {
  const text = base.trim()
  const words = text.split(' ')
  if (words.length >= 3) {
    const at = randInt(1, words.length - 1)
    words.splice(at, 0, piece.trim())
    return words.join(' ')
  }
  const chars = Array.from(text)
  if (chars.length >= 8) {
    const at = randInt(2, chars.length - 2)
    chars.splice(at, 0, piece.trim())
    return chars.join('')
  }
  return joinText(text, piece)
}

export function tidy(text: string): string {
  const cleaned = text.replace(/\s{2,}/g, ' ').trim()
  if (!cleaned) return ''
  return cleaned[0].toUpperCase() + cleaned.slice(1)
}

/** 把若干段文本随机拼成一段 */
export function stitch(parts: string[]): string {
  const pieces = shuffle(parts.map((part) => part.trim()).filter(Boolean))
  if (!pieces.length) return ''

  let text = pieces[0]
  for (let i = 1; i < pieces.length; i += 1) {
    const roll = Math.random()
    if (roll < PREPEND_WEIGHT) text = joinText(pieces[i], text)
    else if (roll < INSERT_WEIGHT) text = insertInside(text, pieces[i])
    else text = joinText(text, pieces[i])
  }
  return tidy(text)
}
