import type { CardItem, WordPos } from '@/types'
import { WORD_POS } from '@/data/wordSeed'
import { isEnglishWord } from '@/utils/text'
import { pickRandom, randInt } from './random'

/**
 * 拼卡成句：把抽到的好几张单词卡塞进一句英文里
 * 模板里的 {0} {1} {2} 按顺序对应 slots，会优先挑词性匹配的卡
 */

type Slot = 'any' | 'noun' | 'verb' | 'adj' | 'adv'

interface Template {
  pattern: string
  slots: Slot[]
}

/** 抽到一张单词卡时用的造句模板 */
const SOLO: Template[] = [
  { pattern: 'I keep thinking about {0}.', slots: ['any'] },
  { pattern: 'Do you ever just say {0} out loud?', slots: ['any'] },
  { pattern: 'Honestly? {0}.', slots: ['any'] },
  { pattern: 'Can we talk about {0} for a second?', slots: ['any'] },
  { pattern: 'Everything feels a little {0} today.', slots: ['adj'] },
  { pattern: 'Give me one good {0} and I will be fine.', slots: ['noun'] },
  { pattern: 'I keep trying to {0}, but not today.', slots: ['verb'] },
  { pattern: 'It is hard to {0} when nobody is around.', slots: ['verb'] },
  { pattern: 'You sound very {0} tonight.', slots: ['adj'] },
  { pattern: 'There is too much {0} in my head.', slots: ['noun'] },
  { pattern: 'Let us start with {0}.', slots: ['any'] },
  { pattern: '{0} — that is my whole mood today.', slots: ['any'] },
]

/** 抽到三张卡时用的拼句模板 */
const COMBO: Template[] = [
  { pattern: 'I keep coming back to {0}, {1} and {2}.', slots: ['any', 'any', 'any'] },
  { pattern: 'Some days are all {0}, some are {1}, and a few are pure {2}.', slots: ['any', 'any', 'any'] },
  { pattern: 'No {0}, no {1}, just a lot of {2}.', slots: ['any', 'any', 'any'] },
  { pattern: 'Between {0} and {1}, I would still pick {2}.', slots: ['any', 'any', 'any'] },
  { pattern: '{0} is just {1} with a bit more {2}.', slots: ['any', 'any', 'any'] },
  { pattern: 'It is hard to {1} when every {0} feels so {2}.', slots: ['noun', 'verb', 'adj'] },
  { pattern: 'Give me one {0} and I will {1} it, {2}.', slots: ['noun', 'verb', 'adv'] },
  { pattern: 'This {0} is too {2} to {1}.', slots: ['noun', 'verb', 'adj'] },
  { pattern: 'Let us {1} before the {0} turns {2}.', slots: ['noun', 'verb', 'adj'] },
  { pattern: 'You make every {0} sound {2}, and I almost {1} it.', slots: ['noun', 'verb', 'adj'] },
  { pattern: 'Every {0} needs someone to {1} it, {2}.', slots: ['noun', 'verb', 'adv'] },
  { pattern: 'I would {1} a {2} {0} any day.', slots: ['noun', 'verb', 'adj'] },
  { pattern: 'Too much {0}, not enough {1}, and way too {2}.', slots: ['noun', 'noun', 'adj'] },
]

function wordOf(card: CardItem): string {
  return (card.lines[0] ?? '').trim()
}

function posOf(word: string): WordPos {
  return WORD_POS[word.toLowerCase()] ?? 'noun'
}

function matches(pos: WordPos, slot: Slot): boolean {
  if (slot === 'any') return true
  return pos === slot
}

function fill(template: Template, cards: CardItem[]): string {
  const used = new Set<number>()
  const words = template.slots.map((slot) => {
    let index = cards.findIndex((card, i) => !used.has(i) && matches(posOf(wordOf(card)), slot))
    if (index < 0) index = cards.findIndex((_, i) => !used.has(i))
    if (index < 0) index = randInt(0, Math.max(0, cards.length - 1))
    used.add(index)
    return wordOf(cards[index]) || 'time'
  })

  let text = template.pattern
  words.forEach((word, index) => {
    text = text.replace(`{${index}}`, word)
  })
  return text.trim()
}

function tidy(text: string): string {
  const cleaned = text.replace(/\s+/g, ' ').trim()
  if (!cleaned) return ''
  return cleaned[0].toUpperCase() + cleaned.slice(1)
}

/** 一张单词卡 → 一句英文 */
export function soloSentence(card: CardItem): string {
  const word = wordOf(card)
  if (!isEnglishWord(word)) return card.lines.join('\n')
  const pos = posOf(word)
  const usable = SOLO.filter((tpl) => tpl.slots.every((slot) => slot === 'any' || slot === pos))
  const template = pickRandom(usable.length ? usable : SOLO)
  return tidy(fill(template ?? SOLO[0], [card]))
}

/** 多张单词卡 → 一句英文 */
export function composeSentence(cards: CardItem[]): string {
  const usable = cards.filter((card) => isEnglishWord(wordOf(card)))
  if (usable.length < 2) return ''
  const template = pickRandom(COMBO) ?? COMBO[0]
  return tidy(fill(template, usable))
}
