import type { CardGroup, CardMeta } from '@/types'
import { CATEGORY_NAME, LANG_NAME, classifyCard } from '@/utils/text'
import { EN_SENTENCES, TOP_WORDS, ZH_SENTENCES, ZH_WORDS } from './wordSeed'

/** 内置字卡的权重：英文为主，中文辅助 */
const WEIGHT: Record<string, number> = {
  en_word: 3,
  en_sentence: 2,
  zh_word: 1,
  zh_sentence: 1,
}

/** 三层分组 id：lang_en / lang_en_word / lang_en_word_A */
export function groupIdOf(meta: CardMeta, level: 'lang' | 'cat' | 'letter'): string {
  const base = `lang_${meta.lang}`
  if (level === 'lang') return base
  if (level === 'cat') return `${base}_${meta.cat}`
  return `${base}_${meta.cat}_${meta.letter === '#' ? 'other' : meta.letter}`
}

export function letterGroupName(letter: string): string {
  return letter === '#' ? '其他' : letter
}

let seq = 0
function nextCardId(): string {
  seq += 1
  return `seed_${seq}`
}

/**
 * 生成内置字卡库：中文 / 英文 → 词语 / 句子 → 首字母
 * 结构由文字内容自动识别，和「快速添加」走的是同一套规则
 */
export function buildSeedGroups(): CardGroup[] {
  seq = 0
  const groups: CardGroup[] = []

  function ensure(meta: CardMeta): CardGroup {
    const langId = groupIdOf(meta, 'lang')
    let langGroup = groups.find((item) => item.id === langId)
    if (!langGroup) {
      langGroup = { id: langId, name: LANG_NAME[meta.lang], enabled: true, weight: 0, cards: [], parentId: null }
      groups.push(langGroup)
    }

    const catId = groupIdOf(meta, 'cat')
    let catGroup = groups.find((item) => item.id === catId)
    if (!catGroup) {
      catGroup = { id: catId, name: CATEGORY_NAME[meta.cat], enabled: true, weight: 0, cards: [], parentId: langId }
      groups.push(catGroup)
    }

    const letterId = groupIdOf(meta, 'letter')
    let letterGroup = groups.find((item) => item.id === letterId)
    if (!letterGroup) {
      letterGroup = {
        id: letterId,
        name: letterGroupName(meta.letter),
        enabled: true,
        weight: WEIGHT[`${meta.lang}_${meta.cat}`] ?? 2,
        cards: [],
        parentId: catId,
        meta,
      }
      groups.push(letterGroup)
    }
    return letterGroup
  }

  function add(lines: string[]): void {
    ensure(classifyCard(lines)).cards.push({ id: nextCardId(), lines })
  }

  TOP_WORDS.forEach((item) => add([item.word]))
  EN_SENTENCES.forEach((text) => add([text]))
  ZH_WORDS.forEach((text) => add([text]))
  ZH_SENTENCES.forEach((text) => add([text]))

  return groups
}
