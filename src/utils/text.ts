import type { CardCategory, CardMeta, LangCode } from '@/types'

/** 中日韩汉字区间（用于判断中文） */
const CJK = /[㐀-䶿一-鿿豈-﫿]/
/** 纯英文单词：一个词，不含空格与标点 */
const EN_WORD = /^[A-Za-z][A-Za-z'-]*$/

/** 拼音首字母边界字，配合中文排序规则使用 */
const PINYIN_BOUNDARY = ['阿', '八', '嚓', '哒', '妸', '发', '旮', '哈', '讥', '咔', '垃', '妈', '拏', '噢', '妑', '七', '呥', '仨', '他', '哇', '夕', '丫', '匝']
const PINYIN_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'W', 'X', 'Y', 'Z']

const collator = typeof Intl !== 'undefined' ? new Intl.Collator('zh-Hans-CN') : null

/** 取汉字的拼音首字母（A-Z，无 I/U/V）；无法确定时返回 # */
function pinyinLetter(char: string): string {
  if (!collator) return '#'
  for (let i = PINYIN_BOUNDARY.length - 1; i >= 0; i -= 1) {
    if (collator.compare(char, PINYIN_BOUNDARY[i]) >= 0) return PINYIN_LETTERS[i]
  }
  return 'A'
}

export function hasChinese(text: string): boolean {
  return CJK.test(text)
}

export function langOf(text: string): LangCode {
  return hasChinese(text) ? 'zh' : 'en'
}

/** 判断一张卡是「词语」还是「句子」 */
export function categoryOf(lines: string[]): CardCategory {
  if (lines.length !== 1) return 'sentence'
  const text = lines[0].trim()
  if (!text || /\s/.test(text)) return 'sentence'
  if (hasChinese(text)) return /^[一-鿿]{1,6}$/.test(text) ? 'word' : 'sentence'
  return EN_WORD.test(text) ? 'word' : 'sentence'
}

/** 首字母：英文取首字母，中文取拼音首字母 */
export function letterOf(text: string, lang: LangCode): string {
  const first = (text.trim()[0] ?? '').toUpperCase()
  if (!first) return '#'
  if (/[A-Z]/.test(first)) return first
  if (lang === 'zh' && CJK.test(first)) return pinyinLetter(first)
  return '#'
}

/** 给一张字卡分类：语言 / 词语或句子 / 首字母 */
export function classifyCard(lines: string[]): CardMeta {
  const text = lines.join(' ').trim()
  const lang = langOf(text)
  return { lang, cat: categoryOf(lines), letter: letterOf(text, lang) }
}

/** 是否是可以直接塞进英文句子里的单词 */
export function isEnglishWord(text: string): boolean {
  return EN_WORD.test(text.trim())
}

/** 语言显示名 */
export const LANG_NAME: Record<LangCode, string> = { en: '英文', zh: '中文' }

/** 类别显示名 */
export const CATEGORY_NAME: Record<CardCategory, string> = { word: '词语', sentence: '句子' }
